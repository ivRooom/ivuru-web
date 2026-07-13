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

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
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

const isAllowedOrigin = (request: Request, env: Env) => {
  const origin = request.headers.get('origin');
  return !origin || allowedOrigins(env, request).has(origin);
};

const verifyTurnstile = async (token: string, request: Request, env: Env) => {
  if (!env.TURNSTILE_SECRET_KEY) return false;

  const body = new FormData();
  body.append('secret', env.TURNSTILE_SECRET_KEY);
  body.append('response', token);
  const remoteIp = request.headers.get('CF-Connecting-IP');
  if (remoteIp) body.append('remoteip', remoteIp);
  body.append('idempotency_key', crypto.randomUUID());

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  });
  if (!response.ok) return false;
  const result = (await response.json()) as { success?: boolean };
  return result.success === true;
};

const sendResendEmail = async (
  env: Env,
  options: { to: string; subject: string; html: string; replyTo?: string },
) => {
  if (!env.RESEND_API_KEY || !env.CONTACT_FROM_EMAIL) throw new Error('Email provider is not configured.');

  const response = await fetch('https://api.resend.com/emails', {
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
    const detail = await response.text();
    console.error('Resend request failed', response.status, detail.slice(0, 500));
    throw new Error('Email delivery failed.');
  }
};

const sendDiscord = async (env: Env, payload: ContactPayload, requestId: string) => {
  if (!env.DISCORD_WEBHOOK_URL) return;
  const response = await fetch(env.DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(buildDiscordMessage(payload, requestId)),
  });
  if (!response.ok) console.error('Discord notification failed', response.status);
};

const getConfig = (env: Env) =>
  json({
    ready: Boolean(env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY && env.RESEND_API_KEY),
    turnstileSiteKey: env.TURNSTILE_SITE_KEY || null,
    recipient: env.CONTACT_TO_EMAIL || 'contact@ivrm.jp',
    discordEnabled: Boolean(env.DISCORD_WEBHOOK_URL),
  });

const handleContact = async (request: Request, env: Env, ctx: ExecutionContext) => {
  if (!isAllowedOrigin(request, env)) return json({ ok: false, code: 'origin_not_allowed' }, 403);
  if (request.method === 'GET') return getConfig(env);
  if (request.method !== 'POST') return json({ ok: false, code: 'method_not_allowed' }, 405);

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) return json({ ok: false, code: 'unsupported_media_type' }, 415);

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
  if (!validation.value) return json({ ok: false, code: 'validation_failed', errors: validation.errors }, 422);
  const payload = validation.value;

  if (payload.website) {
    return json({ ok: true, requestId: crypto.randomUUID(), accepted: true });
  }

  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (env.CONTACT_RATE_LIMITER) {
    const rateLimit = await env.CONTACT_RATE_LIMITER.limit({ key: `contact:${clientIp}` });
    if (!rateLimit.success) return json({ ok: false, code: 'rate_limited' }, 429);
  }

  const verified = await verifyTurnstile(payload.turnstileToken, request, env);
  if (!verified) return json({ ok: false, code: 'turnstile_failed' }, 403);

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
  } catch (error) {
    console.error('Admin notification failed', requestId, error);
    return json({ ok: false, code: 'delivery_failed' }, 502);
  }

  ctx.waitUntil(
    Promise.allSettled([
      sendResendEmail(env, { to: payload.email, subject: receipt.subject, html: receipt.html }),
      sendDiscord(env, payload, requestId),
    ]).then((results) => {
      results.forEach((result) => {
        if (result.status === 'rejected') console.error('Secondary notification failed', requestId, result.reason);
      });
    }),
  );

  return json({ ok: true, requestId, accepted: true }, 202);
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/contact') return handleContact(request, env, ctx);
    if (url.pathname.startsWith('/api/')) return json({ ok: false, code: 'not_found' }, 404);
    return env.ASSETS.fetch(request);
  },
};
