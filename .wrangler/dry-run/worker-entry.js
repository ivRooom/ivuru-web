var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/worker/contact.ts
var categoryLabels = {
  ja: {
    project: "\u958B\u767A\u30FB\u5236\u4F5C\u306E\u76F8\u8AC7",
    community: "ivRm\u30FB\u30B3\u30DF\u30E5\u30CB\u30C6\u30A3",
    media: "\u914D\u4FE1\u30FB\u30E1\u30C7\u30A3\u30A2",
    other: "\u305D\u306E\u4ED6"
  },
  en: {
    project: "Development / Creative",
    community: "ivRm / Community",
    media: "Streaming / Media",
    other: "Other"
  },
  ko: {
    project: "\uAC1C\uBC1C\xB7\uC81C\uC791 \uBB38\uC758",
    community: "ivRm\xB7\uCEE4\uBBA4\uB2C8\uD2F0",
    media: "\uBC29\uC1A1\xB7\uBBF8\uB514\uC5B4",
    other: "\uAE30\uD0C0"
  }
};
var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var categories = /* @__PURE__ */ new Set(["project", "community", "media", "other"]);
var locales = /* @__PURE__ */ new Set(["ja", "en", "ko"]);
var normalizedText = /* @__PURE__ */ __name((value) => typeof value === "string" ? value.trim() : "", "normalizedText");
var sanitizeHeaderValue = /* @__PURE__ */ __name((value) => value.replace(/[\r\n]+/g, " ").replace(/\s{2,}/g, " ").trim(), "sanitizeHeaderValue");
function validateContactPayload(input) {
  if (!input || typeof input !== "object") {
    return { errors: [{ code: "invalid_payload", message: "Invalid request payload." }] };
  }
  const raw = input;
  const name = normalizedText(raw.name);
  const email = normalizedText(raw.email).toLowerCase();
  const subject = normalizedText(raw.subject);
  const message = normalizedText(raw.message);
  const turnstileToken = normalizedText(raw.turnstileToken);
  const website = normalizedText(raw.website);
  const category = normalizedText(raw.category);
  const locale = normalizedText(raw.locale);
  const errors = [];
  if (name.length < 1 || name.length > 80)
    errors.push({ field: "name", code: "invalid_name", message: "Name must be 1\u201380 characters." });
  if (!emailPattern.test(email) || email.length > 254)
    errors.push({ field: "email", code: "invalid_email", message: "Enter a valid email address." });
  if (!categories.has(category))
    errors.push({
      field: "category",
      code: "invalid_category",
      message: "Select a valid category."
    });
  if (subject.length < 2 || subject.length > 120)
    errors.push({
      field: "subject",
      code: "invalid_subject",
      message: "Subject must be 2\u2013120 characters."
    });
  if (message.length < 20 || message.length > 5e3)
    errors.push({
      field: "message",
      code: "invalid_message",
      message: "Message must be 20\u20135000 characters."
    });
  if (!locales.has(locale))
    errors.push({ field: "locale", code: "invalid_locale", message: "Unsupported locale." });
  if (!turnstileToken)
    errors.push({
      field: "turnstileToken",
      code: "turnstile_required",
      message: "Security verification is required."
    });
  if (errors.length) return { errors };
  return {
    value: { name, email, category, subject, message, locale, turnstileToken, website },
    errors
  };
}
__name(validateContactPayload, "validateContactPayload");
function escapeHtml(value) {
  return value.replace(
    /[&<>'"]/g,
    (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    })[char] ?? char
  );
}
__name(escapeHtml, "escapeHtml");
function buildAdminEmail(payload, requestId) {
  const safeName = escapeHtml(payload.name);
  const safeEmail = escapeHtml(payload.email);
  const safeSubject = escapeHtml(payload.subject);
  const safeMessage = escapeHtml(payload.message).replaceAll("\n", "<br />");
  const category = categoryLabels[payload.locale][payload.category];
  return {
    subject: `[ivuru Contact] ${sanitizeHeaderValue(payload.subject)}`,
    html: `
      <h1>New contact request</h1>
      <p><strong>Request ID:</strong> ${requestId}</p>
      <p><strong>Name:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Category:</strong> ${escapeHtml(category)}</p>
      <p><strong>Subject:</strong> ${safeSubject}</p>
      <hr />
      <p>${safeMessage}</p>
    `
  };
}
__name(buildAdminEmail, "buildAdminEmail");
function buildReceiptEmail(payload, requestId) {
  const copy = {
    ja: {
      subject: "\u304A\u554F\u3044\u5408\u308F\u305B\u3092\u53D7\u3051\u4ED8\u3051\u307E\u3057\u305F \u2014 \u3044\u3094\u308B\u3002 / ivuru",
      title: "\u304A\u554F\u3044\u5408\u308F\u305B\u3092\u53D7\u3051\u4ED8\u3051\u307E\u3057\u305F",
      body: "\u5185\u5BB9\u3092\u78BA\u8A8D\u306E\u3046\u3048\u3001\u5FC5\u8981\u306B\u5FDC\u3058\u3066\u3054\u9023\u7D61\u3057\u307E\u3059\u3002\u8FD4\u4FE1\u3092\u304A\u7D04\u675F\u3059\u308B\u3082\u306E\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u306E\u3067\u3001\u3042\u3089\u304B\u3058\u3081\u3054\u4E86\u627F\u304F\u3060\u3055\u3044\u3002",
      label: "\u53D7\u4ED8\u756A\u53F7"
    },
    en: {
      subject: "We received your message \u2014 ivuru",
      title: "Your message has been received",
      body: "We will review your message and contact you when necessary. A reply is not guaranteed.",
      label: "Request ID"
    },
    ko: {
      subject: "\uBB38\uC758\uAC00 \uC811\uC218\uB418\uC5C8\uC2B5\uB2C8\uB2E4 \u2014 ivuru",
      title: "\uBB38\uC758\uAC00 \uC811\uC218\uB418\uC5C8\uC2B5\uB2C8\uB2E4",
      body: "\uB0B4\uC6A9\uC744 \uD655\uC778\uD55C \uB4A4 \uD544\uC694\uD55C \uACBD\uC6B0 \uC5F0\uB77D\uB4DC\uB9AC\uACA0\uC2B5\uB2C8\uB2E4. \uB2F5\uBCC0\uC744 \uBCF4\uC7A5\uD558\uC9C0\uB294 \uC54A\uC2B5\uB2C8\uB2E4.",
      label: "\uC811\uC218 \uBC88\uD638"
    }
  }[payload.locale];
  return {
    subject: copy.subject,
    html: `
      <h1>${copy.title}</h1>
      <p>${copy.body}</p>
      <p><strong>${copy.label}:</strong> ${requestId}</p>
      <p><strong>Subject:</strong> ${escapeHtml(payload.subject)}</p>
      <hr />
      <p>\u3044\u3094\u308B\u3002 / ivuru</p>
    `
  };
}
__name(buildReceiptEmail, "buildReceiptEmail");
function buildDiscordMessage(payload, requestId) {
  const trimmedMessage = payload.message.length > 1500 ? `${payload.message.slice(0, 1497)}...` : payload.message;
  return {
    username: "ivuru Contact Terminal",
    allowed_mentions: { parse: [] },
    embeds: [
      {
        title: payload.subject,
        description: trimmedMessage,
        color: 5629695,
        fields: [
          { name: "Request ID", value: requestId, inline: true },
          {
            name: "Category",
            value: categoryLabels[payload.locale][payload.category],
            inline: true
          },
          { name: "Locale", value: payload.locale, inline: true },
          { name: "Name", value: payload.name.slice(0, 256), inline: true },
          { name: "Email", value: payload.email.slice(0, 256), inline: true }
        ],
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    ]
  };
}
__name(buildDiscordMessage, "buildDiscordMessage");

// src/worker/delivery.ts
var RetryableDeliveryError = class extends Error {
  static {
    __name(this, "RetryableDeliveryError");
  }
  retryAfterMs;
  constructor(message, retryAfterMs) {
    super(message);
    this.name = "RetryableDeliveryError";
    this.retryAfterMs = retryAfterMs;
  }
};
var isRetryableStatus = /* @__PURE__ */ __name((status) => status === 408 || status === 425 || status === 429 || status >= 500, "isRetryableStatus");
var parseRetryAfterMs = /* @__PURE__ */ __name((value, now = Date.now()) => {
  if (!value) return void 0;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1e3;
  const date = Date.parse(value);
  if (Number.isNaN(date)) return void 0;
  return Math.max(0, date - now);
}, "parseRetryAfterMs");
var defaultSleep = /* @__PURE__ */ __name((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)), "defaultSleep");
async function withRetry(operation, options = {}) {
  const attempts = Math.max(1, options.attempts ?? 3);
  const baseDelayMs = Math.max(0, options.baseDelayMs ?? 250);
  const maxDelayMs = Math.max(baseDelayMs, options.maxDelayMs ?? 2e3);
  const sleep = options.sleep ?? defaultSleep;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      if (!(error instanceof RetryableDeliveryError) || attempt === attempts) throw error;
      const exponentialDelay = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
      const requestedDelay = error.retryAfterMs ?? exponentialDelay;
      await sleep(Math.min(maxDelayMs, Math.max(0, requestedDelay)));
    }
  }
  throw new Error("Retry loop exited unexpectedly.");
}
__name(withRetry, "withRetry");

// src/worker/email-delivery.ts
var buildResendPayload = /* @__PURE__ */ __name(({
  from,
  to,
  subject,
  html,
  replyTo,
  bcc
}) => ({
  from,
  to: [to],
  ...bcc?.trim() ? { bcc: [bcc.trim()] } : {},
  subject,
  html,
  ...replyTo?.trim() ? { reply_to: replyTo.trim() } : {}
}), "buildResendPayload");

// src/worker/contact-storage.ts
var encoder = new TextEncoder();
var createStatusToken = /* @__PURE__ */ __name(() => {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}, "createStatusToken");
var hashStatusToken = /* @__PURE__ */ __name(async (token) => {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(token));
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join(
    ""
  );
}, "hashStatusToken");
var calculateSpamScore = /* @__PURE__ */ __name((payload) => {
  const text = `${payload.subject}
${payload.message}`.toLowerCase();
  let score = 0;
  const urlCount = (text.match(/https?:\/\//g) ?? []).length;
  if (urlCount >= 3) score += 30;
  if (urlCount >= 6) score += 30;
  if (/(.)\1{12,}/.test(text)) score += 20;
  if (/\b(crypto|casino|viagra|seo service|backlink|guest post)\b/.test(text)) score += 35;
  if (payload.message.length < 30) score += 5;
  return Math.min(score, 100);
}, "calculateSpamScore");
var saveContactRequest = /* @__PURE__ */ __name(async (db, options) => {
  const expiresAt = new Date(
    new Date(options.createdAt).getTime() + options.retentionDays * 864e5
  ).toISOString();
  const deliveryStatus = options.spamScore >= 80 ? "spam" : "pending";
  const publicStatus = options.spamScore >= 80 ? "received" : "accepted";
  await db.prepare(
    `INSERT INTO contact_requests (
        request_id, public_status, delivery_status, category, locale,
        name, email, subject, message, spam_score, status_token_hash,
        admin_email_status, receipt_email_status, discord_status,
        created_at, updated_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', 'pending', ?, ?, ?)`
  ).bind(
    options.requestId,
    publicStatus,
    deliveryStatus,
    options.payload.category,
    options.payload.locale,
    options.payload.name,
    options.payload.email,
    options.payload.subject,
    options.payload.message,
    options.spamScore,
    options.statusTokenHash,
    options.createdAt,
    options.createdAt,
    expiresAt
  ).run();
}, "saveContactRequest");
var updateDeliveryState = /* @__PURE__ */ __name(async (db, requestId, fields) => {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await db.prepare(
    `UPDATE contact_requests
       SET delivery_status = ?, admin_email_status = ?, receipt_email_status = ?,
           discord_status = ?, public_status = COALESCE(?, public_status),
           last_error_code = ?, updated_at = ?
       WHERE request_id = ?`
  ).bind(
    fields.deliveryStatus,
    fields.adminEmailStatus,
    fields.receiptEmailStatus,
    fields.discordStatus,
    fields.publicStatus ?? null,
    fields.lastErrorCode ?? null,
    now,
    requestId
  ).run();
}, "updateDeliveryState");
var getContactStatus = /* @__PURE__ */ __name(async (db, requestId, statusTokenHash) => db.prepare(
  `SELECT request_id, public_status, delivery_status, admin_email_status,
              receipt_email_status, discord_status, created_at, updated_at, expires_at
       FROM contact_requests
       WHERE request_id = ? AND status_token_hash = ? AND expires_at > ?`
).bind(requestId, statusTokenHash, (/* @__PURE__ */ new Date()).toISOString()).first(), "getContactStatus");
var purgeExpiredContacts = /* @__PURE__ */ __name(async (db) => {
  const result = await db.prepare("DELETE FROM contact_requests WHERE expires_at <= ?").bind((/* @__PURE__ */ new Date()).toISOString()).run();
  return result.meta;
}, "purgeExpiredContacts");

// src/worker/request-body.ts
var PayloadTooLargeError = class extends Error {
  static {
    __name(this, "PayloadTooLargeError");
  }
  constructor() {
    super("payload_too_large");
    this.name = "PayloadTooLargeError";
  }
};
var declaredContentLength = /* @__PURE__ */ __name((request) => {
  const value = request.headers.get("content-length");
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}, "declaredContentLength");
var readTextBodyWithLimit = /* @__PURE__ */ __name(async (request, maxBytes) => {
  const declaredLength = declaredContentLength(request);
  if (declaredLength !== null && declaredLength > maxBytes) {
    throw new PayloadTooLargeError();
  }
  if (!request.body) return "";
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let receivedBytes = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      receivedBytes += value.byteLength;
      if (receivedBytes > maxBytes) {
        await reader.cancel("payload_too_large").catch(() => void 0);
        throw new PayloadTooLargeError();
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return text;
  } finally {
    reader.releaseLock();
  }
}, "readTextBodyWithLimit");

// src/worker.ts
var CONTACT_BODY_LIMIT_BYTES = 24e3;
var STATUS_BODY_LIMIT_BYTES = 2e3;
var logContact = /* @__PURE__ */ __name((level, event, fields = {}) => {
  const payload = { scope: "contact", event, level, ...fields };
  if (level === "error") console.error(payload);
  else if (level === "warn") console.warn(payload);
  else console.log(payload);
}, "logContact");
var json = /* @__PURE__ */ __name((data, status = 200, extraHeaders = {}) => new Response(JSON.stringify(data), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    ...extraHeaders
  }
}), "json");
var allowedOrigins = /* @__PURE__ */ __name((env, request) => {
  const requestOrigin = new URL(request.url).origin;
  return new Set(
    [requestOrigin, ...(env.ALLOWED_ORIGINS ?? "").split(",")].map((value) => value.trim()).filter(Boolean)
  );
}, "allowedOrigins");
var isAllowedPostOrigin = /* @__PURE__ */ __name((request, env) => {
  const origin = request.headers.get("origin");
  if (!origin || !allowedOrigins(env, request).has(origin)) return false;
  const fetchSite = request.headers.get("sec-fetch-site");
  return !fetchSite || fetchSite === "same-origin" || fetchSite === "same-site";
}, "isAllowedPostOrigin");
var fetchWithTimeout = /* @__PURE__ */ __name((input, init, timeoutMs = 8e3) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("timeout"), timeoutMs);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}, "fetchWithTimeout");
var fetchDelivery = /* @__PURE__ */ __name((input, init) => withRetry(
  async () => {
    let response;
    try {
      response = await fetchWithTimeout(input, init);
    } catch {
      throw new RetryableDeliveryError("Delivery request failed before a response was received.");
    }
    if (isRetryableStatus(response.status)) {
      throw new RetryableDeliveryError(
        `Delivery provider returned ${response.status}.`,
        parseRetryAfterMs(response.headers.get("retry-after"))
      );
    }
    return response;
  },
  { attempts: 3, baseDelayMs: 250, maxDelayMs: 2e3 }
), "fetchDelivery");
var verifyTurnstile = /* @__PURE__ */ __name(async (token, request, env) => {
  if (!env.TURNSTILE_SECRET_KEY) return false;
  const body = new FormData();
  body.append("secret", env.TURNSTILE_SECRET_KEY);
  body.append("response", token);
  const remoteIp = request.headers.get("CF-Connecting-IP");
  if (remoteIp) body.append("remoteip", remoteIp);
  body.append("idempotency_key", crypto.randomUUID());
  try {
    const response = await fetchWithTimeout(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body }
    );
    if (!response.ok) return false;
    const result = await response.json();
    const expectedHostname = new URL(request.url).hostname;
    return result.success === true && result.hostname === expectedHostname && result.action === "contact_submit";
  } catch {
    return false;
  }
}, "verifyTurnstile");
var sendResendEmail = /* @__PURE__ */ __name(async (env, options) => {
  const from = options.from || env.CONTACT_FROM_EMAIL;
  if (!env.RESEND_API_KEY || !from) throw new Error("Email provider is not configured.");
  const response = await fetchDelivery("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
      "idempotency-key": options.idempotencyKey
    },
    body: JSON.stringify(
      buildResendPayload({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        replyTo: options.replyTo,
        bcc: options.bcc
      })
    )
  });
  if (!response.ok) {
    console.error("Resend request failed", { status: response.status });
    throw new Error("Email delivery failed.");
  }
}, "sendResendEmail");
var sendDiscord = /* @__PURE__ */ __name(async (env, payload, requestId) => {
  if (!env.DISCORD_WEBHOOK_URL) return;
  const response = await fetchDelivery(env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(buildDiscordMessage(payload, requestId))
  });
  if (!response.ok) throw new Error(`Discord notification failed with ${response.status}.`);
}, "sendDiscord");
var getConfig = /* @__PURE__ */ __name((env) => json({
  ready: Boolean(env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY && env.RESEND_API_KEY),
  turnstileSiteKey: env.TURNSTILE_SITE_KEY || null,
  recipient: env.CONTACT_TO_EMAIL || "contact.ivuru@ivrm.jp",
  discordEnabled: Boolean(env.DISCORD_WEBHOOK_URL),
  queueEnabled: Boolean(env.CONTACT_DB && env.CONTACT_DELIVERY_QUEUE),
  statusEnabled: Boolean(env.CONTACT_DB)
}), "getConfig");
var parseRetentionDays = /* @__PURE__ */ __name((env) => {
  const value = Number(env.CONTACT_RETENTION_DAYS || 90);
  return Number.isFinite(value) ? Math.min(Math.max(Math.trunc(value), 7), 365) : 90;
}, "parseRetentionDays");
var deliverContact = /* @__PURE__ */ __name(async (env, message) => {
  const recipient = env.CONTACT_TO_EMAIL || "contact.ivuru@ivrm.jp";
  const adminEmail = buildAdminEmail(message.payload, message.requestId);
  const receipt = buildReceiptEmail(message.payload, message.requestId);
  await sendResendEmail(env, {
    to: recipient,
    subject: adminEmail.subject,
    html: adminEmail.html,
    replyTo: message.payload.email,
    idempotencyKey: `${message.requestId}:admin`
  });
  const secondary = await Promise.allSettled([
    sendResendEmail(env, {
      to: message.payload.email,
      subject: receipt.subject,
      html: receipt.html,
      from: env.CONTACT_RECEIPT_FROM_EMAIL || env.CONTACT_FROM_EMAIL,
      bcc: env.CONTACT_RECEIPT_BCC_EMAIL,
      idempotencyKey: `${message.requestId}:receipt`
    }),
    sendDiscord(env, message.payload, message.requestId)
  ]);
  const receiptStatus = secondary[0].status === "fulfilled" ? "delivered" : "failed";
  const discordStatus = env.DISCORD_WEBHOOK_URL ? secondary[1].status === "fulfilled" ? "delivered" : "failed" : "disabled";
  const secondaryFailed = secondary.some((result) => result.status === "rejected");
  if (env.CONTACT_DB) {
    await updateDeliveryState(env.CONTACT_DB, message.requestId, {
      deliveryStatus: secondaryFailed ? "partial" : "delivered",
      adminEmailStatus: "delivered",
      receiptEmailStatus: receiptStatus,
      discordStatus,
      publicStatus: secondaryFailed ? "processing" : "delivered",
      lastErrorCode: secondaryFailed ? "secondary_delivery_failed" : null
    });
  }
  if (secondaryFailed) throw new Error("Secondary contact delivery failed.");
}, "deliverContact");
var handleStatus = /* @__PURE__ */ __name(async (request, env) => {
  if (request.method !== "POST")
    return json({ ok: false, code: "method_not_allowed" }, 405, { allow: "POST" });
  if (!isAllowedPostOrigin(request, env))
    return json({ ok: false, code: "origin_not_allowed" }, 403);
  if (!env.CONTACT_DB) return json({ ok: false, code: "status_unavailable" }, 503);
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json")
    return json({ ok: false, code: "unsupported_media_type" }, 415);
  const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
  if (env.CONTACT_RATE_LIMITER) {
    const result = await env.CONTACT_RATE_LIMITER.limit({ key: `contact-status:${clientIp}` });
    if (!result.success) return json({ ok: false, code: "rate_limited" }, 429);
  }
  let body;
  try {
    const rawBody = await readTextBodyWithLimit(request, STATUS_BODY_LIMIT_BYTES);
    body = JSON.parse(rawBody);
  } catch (error) {
    if (error instanceof PayloadTooLargeError)
      return json({ ok: false, code: "payload_too_large" }, 413);
    return json({ ok: false, code: "invalid_json" }, 400);
  }
  const requestId = typeof body.requestId === "string" ? body.requestId.trim() : "";
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!/^IVR-\d{8}-[A-F0-9]{8}$/.test(requestId) || !/^[a-f0-9]{48}$/.test(token))
    return json({ ok: false, code: "invalid_lookup" }, 422);
  const tokenHash = await hashStatusToken(token);
  const record = await getContactStatus(env.CONTACT_DB, requestId, tokenHash);
  if (!record) return json({ ok: false, code: "not_found" }, 404);
  return json({
    ok: true,
    requestId: record.request_id,
    status: record.public_status,
    deliveryStatus: record.delivery_status,
    updatedAt: record.updated_at,
    expiresAt: record.expires_at
  });
}, "handleStatus");
var handleContact = /* @__PURE__ */ __name(async (request, env, ctx) => {
  const rayId = request.headers.get("cf-ray");
  if (request.method === "GET") return getConfig(env);
  if (request.method !== "POST")
    return json({ ok: false, code: "method_not_allowed" }, 405, { allow: "GET, POST" });
  if (!isAllowedPostOrigin(request, env)) {
    logContact("warn", "origin_rejected", { rayId });
    return json({ ok: false, code: "origin_not_allowed" }, 403);
  }
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() ?? "";
  if (contentType !== "application/json")
    return json({ ok: false, code: "unsupported_media_type" }, 415);
  let rawBody;
  try {
    rawBody = await readTextBodyWithLimit(request, CONTACT_BODY_LIMIT_BYTES);
  } catch (error) {
    if (error instanceof PayloadTooLargeError)
      return json({ ok: false, code: "payload_too_large" }, 413);
    throw error;
  }
  let parsed;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return json({ ok: false, code: "invalid_json" }, 400);
  }
  const validation = validateContactPayload(parsed);
  if (!validation.value)
    return json({ ok: false, code: "validation_failed", errors: validation.errors }, 422);
  const payload = validation.value;
  if (payload.website) {
    logContact("warn", "honeypot_accepted", {
      category: payload.category,
      locale: payload.locale,
      rayId
    });
    return json({ ok: true, requestId: crypto.randomUUID(), accepted: true });
  }
  const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
  if (env.CONTACT_RATE_LIMITER) {
    const rateLimit = await env.CONTACT_RATE_LIMITER.limit({ key: `contact:${clientIp}` });
    if (!rateLimit.success) return json({ ok: false, code: "rate_limited" }, 429);
  }
  if (!await verifyTurnstile(payload.turnstileToken, request, env))
    return json({ ok: false, code: "turnstile_failed" }, 403);
  const requestId = `IVR-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const statusToken = createStatusToken();
  const statusTokenHash = await hashStatusToken(statusToken);
  const spamScore = calculateSpamScore(payload);
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
  const message = { requestId, payload, createdAt };
  if (env.CONTACT_DB) {
    await saveContactRequest(env.CONTACT_DB, {
      requestId,
      statusTokenHash,
      payload,
      spamScore,
      createdAt,
      retentionDays: parseRetentionDays(env)
    });
  }
  if (spamScore >= 80) {
    logContact("warn", "spam_suppressed", { requestId, spamScore, rayId });
    return json(
      { ok: true, requestId, statusToken, accepted: true, statusEnabled: Boolean(env.CONTACT_DB) },
      202
    );
  }
  if (env.CONTACT_DB && env.CONTACT_DELIVERY_QUEUE) {
    await env.CONTACT_DELIVERY_QUEUE.send(message, { contentType: "json" });
    logContact("info", "contact_queued", { requestId, spamScore, rayId });
    return json({ ok: true, requestId, statusToken, accepted: true, statusEnabled: true }, 202);
  }
  try {
    await deliverContact(env, message);
  } catch {
    if (env.CONTACT_DB) {
      await updateDeliveryState(env.CONTACT_DB, requestId, {
        deliveryStatus: "failed",
        adminEmailStatus: "failed",
        receiptEmailStatus: "pending",
        discordStatus: env.DISCORD_WEBHOOK_URL ? "pending" : "disabled",
        publicStatus: "processing",
        lastErrorCode: "delivery_failed"
      });
    }
    logContact("error", "delivery_failed", { requestId, rayId });
    return json({ ok: false, code: "delivery_failed" }, 502);
  }
  logContact("info", "contact_accepted", { requestId, spamScore, rayId });
  ctx.waitUntil(Promise.resolve());
  return json(
    { ok: true, requestId, statusToken, accepted: true, statusEnabled: Boolean(env.CONTACT_DB) },
    202
  );
}, "handleContact");
var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/contact") return handleContact(request, env, ctx);
    if (url.pathname === "/api/contact/status") return handleStatus(request, env);
    if (url.pathname.startsWith("/api/")) return json({ ok: false, code: "not_found" }, 404);
    return env.ASSETS.fetch(request);
  },
  async queue(batch, env) {
    for (const message of batch.messages) {
      const requestId = message.body.requestId;
      try {
        if (env.CONTACT_DB) {
          await updateDeliveryState(env.CONTACT_DB, requestId, {
            deliveryStatus: "processing",
            adminEmailStatus: "processing",
            receiptEmailStatus: "pending",
            discordStatus: env.DISCORD_WEBHOOK_URL ? "pending" : "disabled",
            publicStatus: "processing"
          });
        }
        await deliverContact(env, message.body);
        logContact("info", "queue_delivery_succeeded", { requestId, attempts: message.attempts });
        message.ack();
      } catch {
        if (env.CONTACT_DB) {
          await updateDeliveryState(env.CONTACT_DB, requestId, {
            deliveryStatus: "failed",
            adminEmailStatus: "failed",
            receiptEmailStatus: "failed",
            discordStatus: env.DISCORD_WEBHOOK_URL ? "failed" : "disabled",
            publicStatus: "processing",
            lastErrorCode: "queue_delivery_failed"
          });
        }
        logContact("error", "queue_delivery_failed", { requestId, attempts: message.attempts });
        message.retry();
      }
    }
  },
  async scheduled(controller, env) {
    if (!env.CONTACT_DB) return;
    const meta = await purgeExpiredContacts(env.CONTACT_DB);
    logContact("info", "expired_contacts_purged", {
      cron: controller.cron,
      scheduledTime: controller.scheduledTime,
      changes: typeof meta?.changes === "number" ? meta.changes : void 0
    });
  }
};

// src/worker/x-profile.ts
var FALLBACK_IMAGE = "/assets/images/ivuru-profile-fallback.png";
var DEFAULT_USERNAME = "ivuruGG";
var DEFAULT_TTL_SECONDS = 21600;
var clampTtl = /* @__PURE__ */ __name((value) => {
  const parsed = Number(value ?? DEFAULT_TTL_SECONDS);
  if (!Number.isFinite(parsed)) return DEFAULT_TTL_SECONDS;
  return Math.min(Math.max(Math.trunc(parsed), 300), 86400);
}, "clampTtl");
var sanitizeUsername = /* @__PURE__ */ __name((value) => {
  const normalized = (value || DEFAULT_USERNAME).trim().replace(/^@/, "");
  return /^[A-Za-z0-9_]{1,15}$/.test(normalized) ? normalized : DEFAULT_USERNAME;
}, "sanitizeUsername");
var fallbackPayload = /* @__PURE__ */ __name((username, warning) => ({
  ok: false,
  source: "fallback",
  username,
  name: "\u3044\u3094\u308B\u3002 / ivuru",
  description: "Developer / Gamer / Community operator",
  profileImageUrl: FALLBACK_IMAGE,
  profileBannerUrl: null,
  profileUrl: `https://x.com/${username}`,
  verified: false,
  fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
  warning
}), "fallbackPayload");
var jsonResponse = /* @__PURE__ */ __name((payload, ttlSeconds, cacheState) => new Response(JSON.stringify(payload), {
  status: 200,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": `public, max-age=300, s-maxage=${ttlSeconds}`,
    "x-content-type-options": "nosniff",
    "x-profile-cache": cacheState,
    vary: "Accept-Encoding"
  }
}), "jsonResponse");
var normalizeProfileImage = /* @__PURE__ */ __name((url) => {
  if (!url) return FALLBACK_IMAGE;
  return url.replace(/_normal(?=\.[a-z0-9]+(?:\?|$))/i, "_400x400");
}, "normalizeProfileImage");
var buildXProfilePayload = /* @__PURE__ */ __name((response, requestedUsername) => {
  const user = response.data;
  if (!user?.username || !user.name) return null;
  const username = user.username || requestedUsername;
  return {
    ok: true,
    source: "x",
    username,
    name: user.name,
    description: user.description?.trim() || "Developer / Gamer / Community operator",
    profileImageUrl: normalizeProfileImage(user.profile_image_url),
    profileBannerUrl: user.profile_banner_url || null,
    profileUrl: `https://x.com/${username}`,
    verified: user.verified === true,
    fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}, "buildXProfilePayload");
var handleXProfile = /* @__PURE__ */ __name(async (request, env, ctx) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(JSON.stringify({ ok: false, code: "method_not_allowed" }), {
      status: 405,
      headers: {
        allow: "GET, HEAD",
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store"
      }
    });
  }
  const username = sanitizeUsername(env.X_PROFILE_USERNAME);
  const ttlSeconds = clampTtl(env.X_PROFILE_CACHE_TTL_SECONDS);
  const cacheUrl = new URL(request.url);
  cacheUrl.search = "";
  cacheUrl.searchParams.set("username", username.toLowerCase());
  const cacheRequest = new Request(cacheUrl, { method: "GET" });
  const cache = caches.default;
  const cached = await cache.match(cacheRequest);
  if (cached) {
    const hit = new Response(cached.body, cached);
    hit.headers.set("x-profile-cache", "HIT");
    return request.method === "HEAD" ? new Response(null, hit) : hit;
  }
  if (!env.X_BEARER_TOKEN) {
    const fallback = jsonResponse(fallbackPayload(username, "x_not_configured"), 300, "BYPASS");
    return request.method === "HEAD" ? new Response(null, fallback) : fallback;
  }
  try {
    const fields = [
      "description",
      "profile_image_url",
      "profile_banner_url",
      "url",
      "verified"
    ].join(",");
    const endpoint = new URL(`https://api.x.com/2/users/by/username/${username}`);
    endpoint.searchParams.set("user.fields", fields);
    const apiResponse = await fetch(endpoint, {
      headers: {
        authorization: `Bearer ${env.X_BEARER_TOKEN}`,
        accept: "application/json",
        "user-agent": "ivuru-web/1.0"
      },
      signal: AbortSignal.timeout(8e3)
    });
    if (!apiResponse.ok) {
      const fallback = jsonResponse(fallbackPayload(username, "x_request_failed"), 300, "MISS");
      ctx.waitUntil(cache.put(cacheRequest, fallback.clone()));
      return request.method === "HEAD" ? new Response(null, fallback) : fallback;
    }
    const payload = buildXProfilePayload(await apiResponse.json(), username);
    const response = jsonResponse(
      payload ?? fallbackPayload(username, "x_profile_unavailable"),
      payload ? ttlSeconds : 300,
      "MISS"
    );
    ctx.waitUntil(cache.put(cacheRequest, response.clone()));
    return request.method === "HEAD" ? new Response(null, response) : response;
  } catch {
    const fallback = jsonResponse(fallbackPayload(username, "x_request_failed"), 300, "MISS");
    ctx.waitUntil(cache.put(cacheRequest, fallback.clone()));
    return request.method === "HEAD" ? new Response(null, fallback) : fallback;
  }
}, "handleXProfile");

// src/worker-entry.ts
var parseConfiguredOrigins = /* @__PURE__ */ __name((value) => new Set(
  (value ?? "").split(",").map((origin) => origin.trim()).filter(Boolean)
), "parseConfiguredOrigins");
var normalizeApiProxyRequest = /* @__PURE__ */ __name((request, env) => {
  const requestUrl = new URL(request.url);
  if (!requestUrl.pathname.startsWith("/api/")) return request;
  const browserOrigin = request.headers.get("origin");
  if (!browserOrigin || browserOrigin === requestUrl.origin) return request;
  const configuredOrigins = parseConfiguredOrigins(env.ALLOWED_ORIGINS);
  if (!configuredOrigins.has(browserOrigin)) return request;
  let publicOrigin;
  try {
    publicOrigin = new URL(browserOrigin);
  } catch {
    return request;
  }
  requestUrl.protocol = publicOrigin.protocol;
  requestUrl.host = publicOrigin.host;
  return new Request(requestUrl, request);
}, "normalizeApiProxyRequest");
var worker_entry_default = {
  async fetch(request, env, ctx) {
    const normalizedRequest = normalizeApiProxyRequest(request, env);
    if (new URL(normalizedRequest.url).pathname === "/api/x-profile") {
      return handleXProfile(normalizedRequest, env, ctx);
    }
    return worker_default.fetch(normalizedRequest, env, ctx);
  },
  async queue(batch, env) {
    return worker_default.queue(batch, env);
  },
  async scheduled(controller, env) {
    return worker_default.scheduled(controller, env);
  }
};
export {
  worker_entry_default as default,
  normalizeApiProxyRequest
};
//# sourceMappingURL=worker-entry.js.map
