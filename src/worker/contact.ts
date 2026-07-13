export type ContactLocale = 'ja' | 'en' | 'ko';
export type ContactCategory = 'project' | 'community' | 'media' | 'other';

export type ContactPayload = {
  name: string;
  email: string;
  category: ContactCategory;
  subject: string;
  message: string;
  locale: ContactLocale;
  turnstileToken: string;
  website?: string;
};

export type ContactError = {
  field?: keyof ContactPayload;
  code: string;
  message: string;
};

const categoryLabels: Record<ContactLocale, Record<ContactCategory, string>> = {
  ja: { project: '開発・制作の相談', community: 'ivRm・コミュニティ', media: '配信・メディア', other: 'その他' },
  en: { project: 'Development / Creative', community: 'ivRm / Community', media: 'Streaming / Media', other: 'Other' },
  ko: { project: '개발·제작 문의', community: 'ivRm·커뮤니티', media: '방송·미디어', other: '기타' },
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const categories = new Set<ContactCategory>(['project', 'community', 'media', 'other']);
const locales = new Set<ContactLocale>(['ja', 'en', 'ko']);

const normalizedText = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export function validateContactPayload(input: unknown): { value?: ContactPayload; errors: ContactError[] } {
  if (!input || typeof input !== 'object') {
    return { errors: [{ code: 'invalid_payload', message: 'Invalid request payload.' }] };
  }

  const raw = input as Record<string, unknown>;
  const name = normalizedText(raw.name);
  const email = normalizedText(raw.email).toLowerCase();
  const subject = normalizedText(raw.subject);
  const message = normalizedText(raw.message);
  const turnstileToken = normalizedText(raw.turnstileToken);
  const website = normalizedText(raw.website);
  const category = normalizedText(raw.category) as ContactCategory;
  const locale = normalizedText(raw.locale) as ContactLocale;
  const errors: ContactError[] = [];

  if (name.length < 1 || name.length > 80) errors.push({ field: 'name', code: 'invalid_name', message: 'Name must be 1–80 characters.' });
  if (!emailPattern.test(email) || email.length > 254) errors.push({ field: 'email', code: 'invalid_email', message: 'Enter a valid email address.' });
  if (!categories.has(category)) errors.push({ field: 'category', code: 'invalid_category', message: 'Select a valid category.' });
  if (subject.length < 2 || subject.length > 120) errors.push({ field: 'subject', code: 'invalid_subject', message: 'Subject must be 2–120 characters.' });
  if (message.length < 20 || message.length > 5000) errors.push({ field: 'message', code: 'invalid_message', message: 'Message must be 20–5000 characters.' });
  if (!locales.has(locale)) errors.push({ field: 'locale', code: 'invalid_locale', message: 'Unsupported locale.' });
  if (!turnstileToken) errors.push({ field: 'turnstileToken', code: 'turnstile_required', message: 'Security verification is required.' });

  if (errors.length) return { errors };
  return { value: { name, email, category, subject, message, locale, turnstileToken, website }, errors };
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[char] ?? char);
}

export function buildAdminEmail(payload: ContactPayload, requestId: string) {
  const safeName = escapeHtml(payload.name);
  const safeEmail = escapeHtml(payload.email);
  const safeSubject = escapeHtml(payload.subject);
  const safeMessage = escapeHtml(payload.message).replaceAll('\n', '<br />');
  const category = categoryLabels[payload.locale][payload.category];

  return {
    subject: `[ivuru Contact] ${payload.subject}`,
    html: `
      <h1>New contact request</h1>
      <p><strong>Request ID:</strong> ${requestId}</p>
      <p><strong>Name:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Category:</strong> ${escapeHtml(category)}</p>
      <p><strong>Subject:</strong> ${safeSubject}</p>
      <hr />
      <p>${safeMessage}</p>
    `,
  };
}

export function buildReceiptEmail(payload: ContactPayload, requestId: string) {
  const copy = {
    ja: {
      subject: 'お問い合わせを受け付けました — いゔる。 / ivuru',
      title: 'お問い合わせを受け付けました',
      body: '内容を確認のうえ、必要に応じてご連絡します。返信をお約束するものではありませんので、あらかじめご了承ください。',
      label: '受付番号',
    },
    en: {
      subject: 'We received your message — ivuru',
      title: 'Your message has been received',
      body: 'We will review your message and contact you when necessary. A reply is not guaranteed.',
      label: 'Request ID',
    },
    ko: {
      subject: '문의가 접수되었습니다 — ivuru',
      title: '문의가 접수되었습니다',
      body: '내용을 확인한 뒤 필요한 경우 연락드리겠습니다. 답변을 보장하지는 않습니다.',
      label: '접수 번호',
    },
  }[payload.locale];

  return {
    subject: copy.subject,
    html: `
      <h1>${copy.title}</h1>
      <p>${copy.body}</p>
      <p><strong>${copy.label}:</strong> ${requestId}</p>
      <p><strong>Subject:</strong> ${escapeHtml(payload.subject)}</p>
      <hr />
      <p>いゔる。 / ivuru</p>
    `,
  };
}

export function buildDiscordMessage(payload: ContactPayload, requestId: string) {
  const trimmedMessage = payload.message.length > 1500 ? `${payload.message.slice(0, 1497)}...` : payload.message;
  return {
    username: 'ivuru Contact Terminal',
    allowed_mentions: { parse: [] },
    embeds: [
      {
        title: payload.subject,
        description: trimmedMessage,
        color: 0x55e6ff,
        fields: [
          { name: 'Request ID', value: requestId, inline: true },
          { name: 'Category', value: categoryLabels[payload.locale][payload.category], inline: true },
          { name: 'Locale', value: payload.locale, inline: true },
          { name: 'Name', value: payload.name.slice(0, 256), inline: true },
          { name: 'Email', value: payload.email.slice(0, 256), inline: true },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  };
}
