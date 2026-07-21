#!/usr/bin/env bash
set -Eeuo pipefail

REPOSITORY="${REPOSITORY:?REPOSITORY is required}"
DEPLOY_SHA="${DEPLOY_SHA:?DEPLOY_SHA is required}"
SITE_URL="${SITE_URL:-https://runtime.ivrm.jp}"
DEPLOY_BASE="${DEPLOY_BASE:-/opt/ivrm/deployments/ivuru-web}"
LOCK_FILE="${LOCK_FILE:-/var/lock/ivuru-web-deploy.lock}"
RELEASE_DIR="$DEPLOY_BASE/releases/$DEPLOY_SHA"
BACKUP_DIR="$DEPLOY_BASE/backups/$(date -u +%Y%m%dT%H%M%SZ)-$DEPLOY_SHA"

log() {
  printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    log "ERROR: required command not found: $1"
    exit 1
  }
}

require_command docker
require_command git
require_command curl
require_command flock

mkdir -p "$DEPLOY_BASE/releases" "$DEPLOY_BASE/backups"
exec 9>"$LOCK_FILE"
flock -n 9 || {
  log 'ERROR: another deployment is already running.'
  exit 1
}

log "Deploying $REPOSITORY@$DEPLOY_SHA"
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

git clone --filter=blob:none --no-checkout "https://github.com/$REPOSITORY.git" "$RELEASE_DIR/source"
git -C "$RELEASE_DIR/source" fetch --depth 1 origin "$DEPLOY_SHA"
git -C "$RELEASE_DIR/source" checkout --detach "$DEPLOY_SHA"

log 'Building Astro static output in Node.js container.'
docker run --rm \
  --volume "$RELEASE_DIR/source:/workspace" \
  --workdir /workspace \
  --env "SITE_URL=$SITE_URL" \
  node:24-bookworm-slim \
  sh -lc 'npm ci && npm run build'

DIST_DIR="$RELEASE_DIR/source/dist"
test -f "$DIST_DIR/index.html" || {
  log 'ERROR: dist/index.html was not generated.'
  exit 1
}

CADDY_CONTAINER_ID="$(
  docker ps --format '{{.ID}}|{{.Image}}|{{.Names}}' |
    awk -F'|' '$2 ~ /^caddy([:@]|$)/ || $3 ~ /caddy/ {print $1; exit}'
)"

test -n "$CADDY_CONTAINER_ID" || {
  log 'ERROR: running Caddy container was not found.'
  exit 1
}

SITE_MOUNT_SOURCE="$(
  docker inspect "$CADDY_CONTAINER_ID" \
    --format '{{range .Mounts}}{{println .Destination "|" .Source}}{{end}}' |
    awk -F'|' '$1 == "/srv" || $1 == "/usr/share/caddy" {print $2; exit}'
)"

test -n "$SITE_MOUNT_SOURCE" || {
  log 'ERROR: Caddy site bind mount for /srv or /usr/share/caddy was not found.'
  docker inspect "$CADDY_CONTAINER_ID" --format '{{json .Mounts}}'
  exit 1
}

test -d "$SITE_MOUNT_SOURCE" || {
  log "ERROR: Caddy site mount source does not exist: $SITE_MOUNT_SOURCE"
  exit 1
}

log "Caddy container: $CADDY_CONTAINER_ID"
log "Caddy site directory: $SITE_MOUNT_SOURCE"

mkdir -p "$BACKUP_DIR"
cp -a "$SITE_MOUNT_SOURCE/." "$BACKUP_DIR/" 2>/dev/null || true

rollback() {
  local exit_code=$?
  if [[ $exit_code -ne 0 ]]; then
    log "Deployment failed. Restoring backup from $BACKUP_DIR"
    find "$SITE_MOUNT_SOURCE" -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
    cp -a "$BACKUP_DIR/." "$SITE_MOUNT_SOURCE/" 2>/dev/null || true
    docker exec "$CADDY_CONTAINER_ID" caddy reload --config /etc/caddy/Caddyfile >/dev/null 2>&1 || true
  fi
  exit "$exit_code"
}
trap rollback EXIT

log 'Replacing published files.'
find "$SITE_MOUNT_SOURCE" -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
cp -a "$DIST_DIR/." "$SITE_MOUNT_SOURCE/"

log 'Validating and reloading Caddy.'
docker exec "$CADDY_CONTAINER_ID" caddy validate --config /etc/caddy/Caddyfile
docker exec "$CADDY_CONTAINER_ID" caddy reload --config /etc/caddy/Caddyfile

log 'Checking local runtime endpoint.'
for attempt in {1..12}; do
  if curl --fail --silent --show-error --max-time 10 http://localhost:8080/ >/dev/null; then
    log 'Local health check passed.'
    break
  fi
  if [[ "$attempt" -eq 12 ]]; then
    log 'ERROR: local health check failed.'
    exit 1
  fi
  sleep 5
done

log 'Checking public Cloudflare Tunnel endpoint.'
for attempt in {1..12}; do
  if curl --fail --silent --show-error --location --max-time 15 "$SITE_URL" >/dev/null; then
    log 'Public health check passed.'
    break
  fi
  if [[ "$attempt" -eq 12 ]]; then
    log 'ERROR: public health check failed.'
    exit 1
  fi
  sleep 5
done

printf '%s\n' "$DEPLOY_SHA" > "$DEPLOY_BASE/current-release"
find "$DEPLOY_BASE/releases" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' |
  sort -nr |
  awk 'NR > 5 {sub(/^[^ ]+ /, ""); print}' |
  xargs -r rm -rf --
find "$DEPLOY_BASE/backups" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' |
  sort -nr |
  awk 'NR > 5 {sub(/^[^ ]+ /, ""); print}' |
  xargs -r rm -rf --

trap - EXIT
log "Deployment completed successfully: $DEPLOY_SHA"
echo IVURU_EC2_DEPLOY_COMPLETE
