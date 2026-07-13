import {
  buildAdminEmail,
  buildDiscordMessage,
  buildReceiptEmail,
  validateContactPayload,
  type ContactPayload,
} from './worker/contact';

interface AssetsBinding {
  fetch(request: Request): Promise<Response>;
}

interface RateLimitBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

interface WorkerExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

interface Env {
  ASSETS: AssetsBinding;
  CONTACT_RATE_LIMITER?: RateLimitBinding;
  CONTACT_TO_EMAIL?: string;
  CONTACT_FROM_EMAIL?: string;
  ALLOWED_ORIGINS?: string;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  RESEND_API_KEY?: string;
  DISCORD_WEBHOOK_URL?: string;
}

type LogLevel = 'info' | 'warn' | 'error';

const logContact = (
  level: LogLevel,
  event: string,
  fields: Record<string, string | number | boolean | null | undefined> = {},
) => {
  const payload = {
    scope: 'contact',
    event,
    level,
    ...fields,
  };

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
  options: { to: string; subject: string; html: string; replyTo?: string },
) => {
  if (!env.RESEND_API_KEY || !env.CONTACT_FROM_EMAIL)
    throw new Error('Email provider is not configured.');

  const response = await fetchWithTimeout('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json',
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
  const response = await fetchWithTimeout(env.DISCORD_WEBHOOK_URL, {
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
  });

const handleContact = async (request: Request, env: Env, ctx: WorkerExecutionContext) => {
  const rayId = request.headers.get('cf-ray');

  if (request.method === 'GET') {
    const ready = Boolean(env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY && env.RESEND_API_KEY);
    logContact('info', 'config_read', {
      ready,
      discordEnabled: Boolean(env.DISCORD_WEBHOOK_URL),
      rayId,
    });
    return getConfig(env);
  }

  if (request.method !== 'POST') {
    return json({ ok: false, code: 'method_not_allowed' }, 405, { allow: 'GET, POST' });
  }

  if (!isAllowedPostOrigin(request, env)) {
    logContact('warn', 'origin_rejected', { rayId });
    return json({ ok: false, code: 'origin_not_allowed' }, 403);
  }

  const contentType =
    request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase() ?? '';
  if (contentType !== 'application/json')
    return json({ ok: false, code: 'unsupported_media_type' }, 415);

  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (declaredLength > 24_000) return json({ ok: false, code: 'payload_too_large' }, 413);

  const rawBody = await request.text();
  if (rawBody.length > 24_000) return json({ ok: false, code: 'payload_too_large' }, 413);

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return json({ ok: false, code: 'invalid_json' }, 400);
  }

  const validation = validateContactPayload(parsed);
  if (!validation.value) {
    logContact('warn', 'validation_failed', { errorCount: validation.errors.length, rayId });
    return json({ ok: false, code: 'validation_failed', errors: validation.errors }, 422);
  }
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
    if (!rateLimit.success) {
      logContact('warn', 'rate_limited', {
        category: payload.category,
        locale: payload.locale,
        rayId,
      });
      return json({ ok: false, code: 'rate_limited' }, 429);
    }
  }

  const verified = await verifyTurnstile(payload.turnstileToken, request, env);
  if (!verified) {
    logContact('warn', 'turnstile_failed', {
      category: payload.category,
      locale: payload.locale,
      rayId,
    });
    return json({ ok: false, code: 'turnstile_failed' }, 403);
  }

  const requestId = `IVR-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const recipient = env.CONTACT_TO_EMAIL || 'contact@ivrm.jp';
  const adminEmail = buildAdminEmail(payload, requestId);
  const receipt = buildReceiptEmail(payload, requestId);

  try {
    await sendResendEmail(env, {
      to: recipient,
      subject: adminEmail.subject,
      html: adminEmail.html,
      replyTo: payload.email,
    });
  } catch {
    logContact('error', 'admin_delivery_failed', {
      requestId,
      category: payload.category,
      locale: payload.locale,
      rayId,
    });
    return json({ ok: false, code: 'delivery_failed' }, 502);
  }

  logContact('info', 'contact_accepted', {
    requestId,
    category: payload.category,
    locale: payload.locale,
    discordEnabled: Boolean(env.DISCORD_WEBHOOK_URL),
    rayId,
  });

  ctx.waitUntil(
    Promise.allSettled([
      sendResendEmail(env, { to: payload.email, subject: receipt.subject, html: receipt.html }),
      sendDiscord(env, payload, requestId),
    ]).then((results) => {
      const names = ['receipt_email', 'discord'] as const;
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          logContact('error', 'secondary_delivery_failed', {
            requestId,
            channel: names[index],
            category: payload.category,
            locale: payload.locale,
            rayId,
          });
        }
      });
    }),
  );

  return json({ ok: true, requestId, accepted: true }, 202);
};

export default {
  async fetch(request: Request, env: Env, ctx: WorkerExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/contact') return handleContact(request, env, ctx);
    if (url.pathname.startsWith('/api/')) return json({ ok: false, code: 'not_found' }, 404);
    return env.ASSETS.fetch(request);
  },
};
