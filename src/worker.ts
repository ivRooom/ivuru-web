import {
  buildAdminEmail,
  buildDiscordMessage,
  buildReceiptEmail,
  validateContactPayload,
  type ContactPayload,
} from './worker/contact';
import {
  isRetryableStatus,
  parseRetryAfterMs,
  RetryableDeliveryError,
  withRetry,
} from './worker/delivery';
import {
  calculateSpamScore,
  createStatusToken,
  getContactStatus,
  hashStatusToken,
  purgeExpiredContacts,
  saveContactRequest,
  updateDeliveryState,
  type ContactQueueMessage,
  type D1Database,
} from './worker/contact-storage';
import { PayloadTooLargeError, readTextBodyWithLimit } from './worker/request-body';

interface AssetsBinding {
  fetch(request: Request): Promise<Response>;
}

interface RateLimitBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

interface QueueBinding<T> {
  send(message: T, options?: { contentType?: 'json' }): Promise<void>;
}

interface WorkerExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

interface QueueMessage<T> {
  body: T;
  attempts: number;
  ack(): void;
  retry(options?: { delaySeconds?: number }): void;
}

interface MessageBatch<T> {
  queue: string;
  messages: QueueMessage<T>[];
}

interface ScheduledController {
  cron: string;
  scheduledTime: number;
}

interface Env {
  ASSETS: AssetsBinding;
  CONTACT_RATE_LIMITER?: RateLimitBinding;
  CONTACT_DB?: D1Database;
  CONTACT_DELIVERY_QUEUE?: QueueBinding<ContactQueueMessage>;
  CONTACT_TO_EMAIL?: string;
  CONTACT_FROM_EMAIL?: string;
  CONTACT_RETENTION_DAYS?: string;
  ALLOWED_ORIGINS?: string;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  RESEND_API_KEY?: string;
  DISCORD_WEBHOOK_URL?: string;
}

const CONTACT_BODY_LIMIT_BYTES = 24_000;
const STATUS_BODY_LIMIT_BYTES = 2_000;

type LogLevel = 'info' | 'warn' | 'error';

const logContact = (
  level: LogLevel,
  event: string,
  fields: Record<string, string | number | boolean | null | undefined> = {},
) => {
  const payload = { scope: 'contact', event, level, ...fields };
  if (level === 'error') console.error(payload);
  else if (level === 'warn') console.warn(payload);
  else console.log(payload);
};

const json = (data: unknown, status = 200, extraHeaders: HeadersInit = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...extraHeaders,
    },
  });

const allowedOrigins = (env: Env, request: Request) => {
  const requestOrigin = new URL(request.url).origin;
  return new Set(
    [requestOrigin, ...(env.ALLOWED_ORIGINS ?? '').split(',')]
      .map((value) => value.trim())
      .filter(Boolean),
  );
};

const isAllowedPostOrigin = (request: Request, env: Env) => {
  const origin = request.headers.get('origin');
  if (!origin || !allowedOrigins(env, request).has(origin)) return false;
  const fetchSite = request.headers.get('sec-fetch-site');
  return !fetchSite || fetchSite === 'same-origin' || fetchSite === 'same-site';
};

const fetchWithTimeout = (input: RequestInfo | URL, init: RequestInit, timeoutMs = 8_000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), timeoutMs);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
};

const fetchDelivery = (input: RequestInfo | URL, init: RequestInit) =>
  withRetry(
    async () => {
      let response: Response;
      try {
        response = await fetchWithTimeout(input, init);
      } catch {
        throw new RetryableDeliveryError('Delivery request failed before a response was received.');
      }
      if (isRetryableStatus(response.status)) {
        throw new RetryableDeliveryError(
          `Delivery provider returned ${response.status}.`,
          parseRetryAfterMs(response.headers.get('retry-after')),
        );
      }
      return response;
    },
    { attempts: 3, baseDelayMs: 250, maxDelayMs: 2_000 },
  );

const verifyTurnstile = async (token: string, request: Request, env: Env) => {
  if (!env.TURNSTILE_SECRET_KEY) return false;
  const body = new FormData();
  body.append('secret', env.TURNSTILE_SECRET_KEY);
  body.append('response', token);
  const remoteIp = request.headers.get('CF-Connecting-IP');
  if (remoteIp) body.append('remoteip', remoteIp);
  body.append('idempotency_key', crypto.randomUUID());
  try {
    const response = await fetchWithTimeout(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      { method: 'POST', body },
    );
    if (!response.ok) return false;
    const result = (await response.json()) as {
      success?: boolean;
      hostname?: string;
      action?: string;
    };
    const expectedHostname = new URL(request.url).hostname;
    return (
      result.success === true &&
      result.hostname === expectedHostname &&
      result.action === 'contact_submit'
    );
  } catch {
    return false;
  }
};

const sendResendEmail = async (
  env: Env,
  options: {
    to: string;
    subject: string;
    html: string;
    replyTo?: string;
    idempotencyKey: string;
  },
) => {
  if (!env.RESEND_API_KEY || !env.CONTACT_FROM_EMAIL)
    throw new Error('Email provider is not configured.');
  const response = await fetchDelivery('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json',
      'idempotency-key': options.idempotencyKey,
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM_EMAIL,
      to: [options.to],
      subject: options.subject,
      html: options.html,
      reply_to: options.replyTo,
    }),
  });
  if (!response.ok) {
    console.error('Resend request failed', { status: response.status });
    throw new Error('Email delivery failed.');
  }
};

const sendDiscord = async (env: Env, payload: ContactPayload, requestId: string) => {
  if (!env.DISCORD_WEBHOOK_URL) return;
  const response = await fetchDelivery(env.DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(buildDiscordMessage(payload, requestId)),
  });
  if (!response.ok) throw new Error(`Discord notification failed with ${response.status}.`);
};

const getConfig = (env: Env) =>
  json({
    ready: Boolean(env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY && env.RESEND_API_KEY),
    turnstileSiteKey: env.TURNSTILE_SITE_KEY || null,
    recipient: env.CONTACT_TO_EMAIL || 'contact@ivrm.jp',
    discordEnabled: Boolean(env.DISCORD_WEBHOOK_URL),
    queueEnabled: Boolean(env.CONTACT_DB && env.CONTACT_DELIVERY_QUEUE),
    statusEnabled: Boolean(env.CONTACT_DB),
  });

const parseRetentionDays = (env: Env) => {
  const value = Number(env.CONTACT_RETENTION_DAYS || 90);
  return Number.isFinite(value) ? Math.min(Math.max(Math.trunc(value), 7), 365) : 90;
};

const deliverContact = async (env: Env, message: ContactQueueMessage) => {
  const recipient = env.CONTACT_TO_EMAIL || 'contact@ivrm.jp';
  const adminEmail = buildAdminEmail(message.payload, message.requestId);
  const receipt = buildReceiptEmail(message.payload, message.requestId);

  await sendResendEmail(env, {
    to: recipient,
    subject: adminEmail.subject,
    html: adminEmail.html,
    replyTo: message.payload.email,
    idempotencyKey: `${message.requestId}:admin`,
  });

  const secondary = await Promise.allSettled([
    sendResendEmail(env, {
      to: message.payload.email,
      subject: receipt.subject,
      html: receipt.html,
      idempotencyKey: `${message.requestId}:receipt`,
    }),
    sendDiscord(env, message.payload, message.requestId),
  ]);
  const receiptStatus = secondary[0].status === 'fulfilled' ? 'delivered' : 'failed';
  const discordStatus = env.DISCORD_WEBHOOK_URL
    ? secondary[1].status === 'fulfilled'
      ? 'delivered'
      : 'failed'
    : 'disabled';
  const secondaryFailed = secondary.some((result) => result.status === 'rejected');

  if (env.CONTACT_DB) {
    await updateDeliveryState(env.CONTACT_DB, message.requestId, {
      deliveryStatus: secondaryFailed ? 'partial' : 'delivered',
      adminEmailStatus: 'delivered',
      receiptEmailStatus: receiptStatus,
      discordStatus,
      publicStatus: secondaryFailed ? 'processing' : 'delivered',
      lastErrorCode: secondaryFailed ? 'secondary_delivery_failed' : null,
    });
  }

  if (secondaryFailed) throw new Error('Secondary contact delivery failed.');
};

const handleStatus = async (request: Request, env: Env) => {
  if (request.method !== 'POST')
    return json({ ok: false, code: 'method_not_allowed' }, 405, { allow: 'POST' });
  if (!isAllowedPostOrigin(request, env))
    return json({ ok: false, code: 'origin_not_allowed' }, 403);
  if (!env.CONTACT_DB) return json({ ok: false, code: 'status_unavailable' }, 503);
  const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  if (contentType !== 'application/json')
    return json({ ok: false, code: 'unsupported_media_type' }, 415);

  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (env.CONTACT_RATE_LIMITER) {
    const result = await env.CONTACT_RATE_LIMITER.limit({ key: `contact-status:${clientIp}` });
    if (!result.success) return json({ ok: false, code: 'rate_limited' }, 429);
  }

  let body: { requestId?: unknown; token?: unknown };
  try {
    const rawBody = await readTextBodyWithLimit(request, STATUS_BODY_LIMIT_BYTES);
    body = JSON.parse(rawBody) as { requestId?: unknown; token?: unknown };
  } catch (error) {
    if (error instanceof PayloadTooLargeError)
      return json({ ok: false, code: 'payload_too_large' }, 413);
    return json({ ok: false, code: 'invalid_json' }, 400);
  }
  const requestId = typeof body.requestId === 'string' ? body.requestId.trim() : '';
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  if (!/^IVR-\d{8}-[A-F0-9]{8}$/.test(requestId) || !/^[a-f0-9]{48}$/.test(token))
    return json({ ok: false, code: 'invalid_lookup' }, 422);

  const tokenHash = await hashStatusToken(token);
  const record = await getContactStatus(env.CONTACT_DB, requestId, tokenHash);
  if (!record) return json({ ok: false, code: 'not_found' }, 404);
  return json({
    ok: true,
    requestId: record.request_id,
    status: record.public_status,
    deliveryStatus: record.delivery_status,
    updatedAt: record.updated_at,
    expiresAt: record.expires_at,
  });
};

const handleContact = async (request: Request, env: Env, ctx: WorkerExecutionContext) => {
  const rayId = request.headers.get('cf-ray');
  if (request.method === 'GET') return getConfig(env);
  if (request.method !== 'POST')
    return json({ ok: false, code: 'method_not_allowed' }, 405, { allow: 'GET, POST' });
  if (!isAllowedPostOrigin(request, env)) {
    logContact('warn', 'origin_rejected', { rayId });
    return json({ ok: false, code: 'origin_not_allowed' }, 403);
  }
  const contentType =
    request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase() ?? '';
  if (contentType !== 'application/json')
    return json({ ok: false, code: 'unsupported_media_type' }, 415);
  let rawBody: string;
  try {
    rawBody = await readTextBodyWithLimit(request, CONTACT_BODY_LIMIT_BYTES);
  } catch (error) {
    if (error instanceof PayloadTooLargeError)
      return json({ ok: false, code: 'payload_too_large' }, 413);
    throw error;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return json({ ok: false, code: 'invalid_json' }, 400);
  }
  const validation = validateContactPayload(parsed);
  if (!validation.value)
    return json({ ok: false, code: 'validation_failed', errors: validation.errors }, 422);
  const payload = validation.value;

  if (payload.website) {
    logContact('warn', 'honeypot_accepted', {
      category: payload.category,
      locale: payload.locale,
      rayId,
    });
    return json({ ok: true, requestId: crypto.randomUUID(), accepted: true });
  }

  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (env.CONTACT_RATE_LIMITER) {
    const rateLimit = await env.CONTACT_RATE_LIMITER.limit({ key: `contact:${clientIp}` });
    if (!rateLimit.success) return json({ ok: false, code: 'rate_limited' }, 429);
  }
  if (!(await verifyTurnstile(payload.turnstileToken, request, env)))
    return json({ ok: false, code: 'turnstile_failed' }, 403);

  const requestId = `IVR-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const statusToken = createStatusToken();
  const statusTokenHash = await hashStatusToken(statusToken);
  const spamScore = calculateSpamScore(payload);
  const createdAt = new Date().toISOString();
  const message: ContactQueueMessage = { requestId, payload, createdAt };

  if (env.CONTACT_DB) {
    await saveContactRequest(env.CONTACT_DB, {
      requestId,
      statusTokenHash,
      payload,
      spamScore,
      createdAt,
      retentionDays: parseRetentionDays(env),
    });
  }

  if (spamScore >= 80) {
    logContact('warn', 'spam_suppressed', { requestId, spamScore, rayId });
    return json(
      { ok: true, requestId, statusToken, accepted: true, statusEnabled: Boolean(env.CONTACT_DB) },
      202,
    );
  }

  if (env.CONTACT_DB && env.CONTACT_DELIVERY_QUEUE) {
    await env.CONTACT_DELIVERY_QUEUE.send(message, { contentType: 'json' });
    logContact('info', 'contact_queued', { requestId, spamScore, rayId });
    return json({ ok: true, requestId, statusToken, accepted: true, statusEnabled: true }, 202);
  }

  try {
    await deliverContact(env, message);
  } catch {
    if (env.CONTACT_DB) {
      await updateDeliveryState(env.CONTACT_DB, requestId, {
        deliveryStatus: 'failed',
        adminEmailStatus: 'failed',
        receiptEmailStatus: 'pending',
        discordStatus: env.DISCORD_WEBHOOK_URL ? 'pending' : 'disabled',
        publicStatus: 'processing',
        lastErrorCode: 'delivery_failed',
      });
    }
    logContact('error', 'delivery_failed', { requestId, rayId });
    return json({ ok: false, code: 'delivery_failed' }, 502);
  }

  logContact('info', 'contact_accepted', { requestId, spamScore, rayId });
  ctx.waitUntil(Promise.resolve());
  return json(
    { ok: true, requestId, statusToken, accepted: true, statusEnabled: Boolean(env.CONTACT_DB) },
    202,
  );
};

export default {
  async fetch(request: Request, env: Env, ctx: WorkerExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/contact') return handleContact(request, env, ctx);
    if (url.pathname === '/api/contact/status') return handleStatus(request, env);
    if (url.pathname.startsWith('/api/')) return json({ ok: false, code: 'not_found' }, 404);
    return env.ASSETS.fetch(request);
  },

  async queue(batch: MessageBatch<ContactQueueMessage>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      const requestId = message.body.requestId;
      try {
        if (env.CONTACT_DB) {
          await updateDeliveryState(env.CONTACT_DB, requestId, {
            deliveryStatus: 'processing',
            adminEmailStatus: 'processing',
            receiptEmailStatus: 'pending',
            discordStatus: env.DISCORD_WEBHOOK_URL ? 'pending' : 'disabled',
            publicStatus: 'processing',
          });
        }
        await deliverContact(env, message.body);
        logContact('info', 'queue_delivery_succeeded', { requestId, attempts: message.attempts });
        message.ack();
      } catch {
        if (env.CONTACT_DB) {
          await updateDeliveryState(env.CONTACT_DB, requestId, {
            deliveryStatus: 'failed',
            adminEmailStatus: 'failed',
            receiptEmailStatus: 'failed',
            discordStatus: env.DISCORD_WEBHOOK_URL ? 'failed' : 'disabled',
            publicStatus: 'processing',
            lastErrorCode: 'queue_delivery_failed',
          });
        }
        logContact('error', 'queue_delivery_failed', { requestId, attempts: message.attempts });
        message.retry();
      }
    }
  },

  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    if (!env.CONTACT_DB) return;
    const meta = await purgeExpiredContacts(env.CONTACT_DB);
    logContact('info', 'expired_contacts_purged', {
      cron: controller.cron,
      scheduledTime: controller.scheduledTime,
      changes: typeof meta?.changes === 'number' ? meta.changes : undefined,
    });
  },
};
