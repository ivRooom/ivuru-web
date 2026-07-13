# Contact Queue / D1 Operations

## Purpose

The Contact API can operate in two modes.

1. **Fallback mode**: existing synchronous Resend and Discord delivery.
2. **Durable mode**: D1 persistence followed by Cloudflare Queue delivery.

Durable mode is enabled only when both `CONTACT_DB` and `CONTACT_DELIVERY_QUEUE` bindings exist. Missing bindings do not break the current production form.

## Cloudflare resources

Create the following resources in the same Cloudflare account as the Worker.

```bash
npx wrangler d1 create ivuru-contact-production
npx wrangler queues create ivuru-contact-delivery
npx wrangler queues create ivuru-contact-delivery-dlq
```

Copy `wrangler.contact.example.jsonc` entries into `wrangler.jsonc` and replace `REPLACE_WITH_D1_DATABASE_ID` with the ID returned by the D1 create command.

Apply the database migration before deploying the binding.

```bash
npx wrangler d1 migrations apply ivuru-contact-production --remote
npx wrangler deploy --dry-run --outdir .wrangler/dry-run
```

## Stored data

D1 stores the following for up to `CONTACT_RETENTION_DAYS` days. The default is 90 days and the accepted range is 7–365 days.

- Request ID
- Name and email address
- Category, locale, subject, and message
- Internal spam score
- Delivery states for admin email, receipt email, and Discord
- SHA-256 hash of the status lookup key
- Created, updated, and expiration timestamps

The raw lookup key is returned once to the visitor and stored only in browser `sessionStorage`. D1 stores only its SHA-256 hash.

The public status API never returns the name, email address, subject, message, spam score, or provider error details.

## Queue behavior

- Producer binding: `CONTACT_DELIVERY_QUEUE`
- Consumer queue: `ivuru-contact-delivery`
- Maximum retries: 5
- Retry delay: 60 seconds
- Dead-letter queue: `ivuru-contact-delivery-dlq`
- Resend uses stable idempotency keys based on the request ID.
- Discord does not provide equivalent idempotency, so a retry after an uncertain response can create a duplicate notification.

Messages that reach an internal spam score of 80 or higher are accepted without revealing the decision to the sender and are not queued for delivery.

## Status lookup

The UI is available at:

- `/contact/status/`
- `/en/contact/status/`
- `/ko/contact/status/`

The API accepts a same-origin JSON POST to `/api/contact/status` containing:

```json
{
  "requestId": "IVR-20260714-ABCDEF12",
  "token": "48-character lookup key"
}
```

Responses intentionally contain only processing status and timestamps.

## Retention and deletion

The Worker schedules a daily cleanup at `18:17 UTC` (`03:17 JST`) and deletes records whose `expires_at` is in the past. The scheduled handler does nothing when the D1 binding is absent.

Manual verification:

```bash
npx wrangler d1 execute ivuru-contact-production --remote \
  --command "SELECT delivery_status, COUNT(*) FROM contact_requests GROUP BY delivery_status"
```

Do not copy inquiry bodies, email addresses, Turnstile tokens, Resend keys, or Discord webhook URLs into logs, GitHub issues, Linear, or analytics.

## Observability

Structured Worker log events include:

- `contact_queued`
- `spam_suppressed`
- `queue_delivery_succeeded`
- `queue_delivery_failed`
- `expired_contacts_purged`

Alert candidates:

- Queue backlog growth
- Dead-letter queue messages greater than zero
- Repeated `queue_delivery_failed`
- Resend or Discord 429/5xx increases
- Contact API 5xx increases

## Rollback

Removing the D1 and Queue bindings returns the Worker to the synchronous fallback mode. Do not delete D1 until the retention period, pending delivery state, and deletion request handling have been reviewed.
