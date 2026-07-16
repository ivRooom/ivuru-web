export interface XProfileEnv {
  X_BEARER_TOKEN?: string;
  X_PROFILE_USERNAME?: string;
  X_PROFILE_CACHE_TTL_SECONDS?: string;
}

export interface XProfilePayload {
  ok: boolean;
  source: 'x' | 'fallback';
  username: string;
  name: string;
  description: string;
  profileImageUrl: string;
  profileBannerUrl: string | null;
  profileUrl: string;
  verified: boolean;
  fetchedAt: string;
  warning?: 'x_not_configured' | 'x_request_failed' | 'x_profile_unavailable';
}

interface XUserResponse {
  data?: {
    id?: string;
    username?: string;
    name?: string;
    description?: string;
    profile_image_url?: string;
    profile_banner_url?: string;
    url?: string;
    verified?: boolean;
  };
}

interface WorkerExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

interface CloudflareCacheStorage extends CacheStorage {
  readonly default: Cache;
}

const FALLBACK_IMAGE = '/assets/images/ivuru-profile-fallback.png';
const DEFAULT_USERNAME = 'ivuruGG';
const DEFAULT_TTL_SECONDS = 21_600;

const clampTtl = (value: string | undefined) => {
  const parsed = Number(value ?? DEFAULT_TTL_SECONDS);
  if (!Number.isFinite(parsed)) return DEFAULT_TTL_SECONDS;
  return Math.min(Math.max(Math.trunc(parsed), 300), 86_400);
};

const sanitizeUsername = (value: string | undefined) => {
  const normalized = (value || DEFAULT_USERNAME).trim().replace(/^@/, '');
  return /^[A-Za-z0-9_]{1,15}$/.test(normalized) ? normalized : DEFAULT_USERNAME;
};

const fallbackPayload = (
  username: string,
  warning: XProfilePayload['warning'],
): XProfilePayload => ({
  ok: false,
  source: 'fallback',
  username,
  name: 'いゔる。 / ivuru',
  description: 'Developer / Gamer / Community operator',
  profileImageUrl: FALLBACK_IMAGE,
  profileBannerUrl: null,
  profileUrl: `https://x.com/${username}`,
  verified: false,
  fetchedAt: new Date().toISOString(),
  warning,
});

const jsonResponse = (payload: XProfilePayload, ttlSeconds: number, cacheState: string) =>
  new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': `public, max-age=300, s-maxage=${ttlSeconds}`,
      'x-content-type-options': 'nosniff',
      'x-profile-cache': cacheState,
      vary: 'Accept-Encoding',
    },
  });

const normalizeProfileImage = (url: string | undefined) => {
  if (!url) return FALLBACK_IMAGE;
  return url.replace(/_normal(?=\.[a-z0-9]+(?:\?|$))/i, '_400x400');
};

export const buildXProfilePayload = (
  response: XUserResponse,
  requestedUsername: string,
): XProfilePayload | null => {
  const user = response.data;
  if (!user?.username || !user.name) return null;

  const username = user.username || requestedUsername;
  return {
    ok: true,
    source: 'x',
    username,
    name: user.name,
    description: user.description?.trim() || 'Developer / Gamer / Community operator',
    profileImageUrl: normalizeProfileImage(user.profile_image_url),
    profileBannerUrl: user.profile_banner_url || null,
    profileUrl: `https://x.com/${username}`,
    verified: user.verified === true,
    fetchedAt: new Date().toISOString(),
  };
};

export const handleXProfile = async (
  request: Request,
  env: XProfileEnv,
  ctx: WorkerExecutionContext,
): Promise<Response> => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(JSON.stringify({ ok: false, code: 'method_not_allowed' }), {
      status: 405,
      headers: {
        allow: 'GET, HEAD',
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  }

  const username = sanitizeUsername(env.X_PROFILE_USERNAME);
  const ttlSeconds = clampTtl(env.X_PROFILE_CACHE_TTL_SECONDS);
  const cacheUrl = new URL(request.url);
  cacheUrl.search = '';
  cacheUrl.searchParams.set('username', username.toLowerCase());
  const cacheRequest = new Request(cacheUrl, { method: 'GET' });
  const cache = (caches as CloudflareCacheStorage).default;

  const cached = await cache.match(cacheRequest);
  if (cached) {
    const hit = new Response(cached.body, cached);
    hit.headers.set('x-profile-cache', 'HIT');
    return request.method === 'HEAD' ? new Response(null, hit) : hit;
  }

  if (!env.X_BEARER_TOKEN) {
    const fallback = jsonResponse(fallbackPayload(username, 'x_not_configured'), 300, 'BYPASS');
    return request.method === 'HEAD' ? new Response(null, fallback) : fallback;
  }

  try {
    const fields = [
      'description',
      'profile_image_url',
      'profile_banner_url',
      'url',
      'verified',
    ].join(',');
    const endpoint = new URL(`https://api.x.com/2/users/by/username/${username}`);
    endpoint.searchParams.set('user.fields', fields);

    const apiResponse = await fetch(endpoint, {
      headers: {
        authorization: `Bearer ${env.X_BEARER_TOKEN}`,
        accept: 'application/json',
        'user-agent': 'ivuru-web/1.0',
      },
      signal: AbortSignal.timeout(8_000),
    });

    if (!apiResponse.ok) {
      const fallback = jsonResponse(fallbackPayload(username, 'x_request_failed'), 300, 'MISS');
      ctx.waitUntil(cache.put(cacheRequest, fallback.clone()));
      return request.method === 'HEAD' ? new Response(null, fallback) : fallback;
    }

    const payload = buildXProfilePayload((await apiResponse.json()) as XUserResponse, username);
    const response = jsonResponse(
      payload ?? fallbackPayload(username, 'x_profile_unavailable'),
      payload ? ttlSeconds : 300,
      'MISS',
    );
    ctx.waitUntil(cache.put(cacheRequest, response.clone()));
    return request.method === 'HEAD' ? new Response(null, response) : response;
  } catch {
    const fallback = jsonResponse(fallbackPayload(username, 'x_request_failed'), 300, 'MISS');
    ctx.waitUntil(cache.put(cacheRequest, fallback.clone()));
    return request.method === 'HEAD' ? new Response(null, fallback) : fallback;
  }
};
