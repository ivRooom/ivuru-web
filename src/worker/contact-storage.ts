import type { ContactPayload } from './contact';

export interface D1Result<T = unknown> {
  success: boolean;
  results?: T[];
  meta?: Record<string, unknown>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run<T = unknown>(): Promise<D1Result<T>>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}

export type ContactDeliveryStatus = 'pending' | 'processing' | 'delivered' | 'partial' | 'failed' | 'spam';

export interface ContactQueueMessage {
  requestId: string;
  payload: ContactPayload;
  createdAt: string;
}

export interface ContactStatusRecord {
  request_id: string;
  public_status: string;
  delivery_status: ContactDeliveryStatus;
  admin_email_status: string;
  receipt_email_status: string;
  discord_status: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

const encoder = new TextEncoder();

export const createStatusToken = () => {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
};

export const hashStatusToken = async (token: string) => {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(token));
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('');
};

export const calculateSpamScore = (payload: ContactPayload) => {
  const text = `${payload.subject}\n${payload.message}`.toLowerCase();
  let score = 0;
  const urlCount = (text.match(/https?:\/\//g) ?? []).length;
  if (urlCount >= 3) score += 30;
  if (urlCount >= 6) score += 30;
  if (/(.)\1{12,}/.test(text)) score += 20;
  if (/\b(crypto|casino|viagra|seo service|backlink|guest post)\b/.test(text)) score += 35;
  if (payload.message.length < 30) score += 5;
  return Math.min(score, 100);
};

export const saveContactRequest = async (
  db: D1Database,
  options: {
    requestId: string;
    statusTokenHash: string;
    payload: ContactPayload;
    spamScore: number;
    createdAt: string;
    retentionDays: number;
  },
) => {
  const expiresAt = new Date(
    new Date(options.createdAt).getTime() + options.retentionDays * 86_400_000,
  ).toISOString();
  const deliveryStatus: ContactDeliveryStatus = options.spamScore >= 80 ? 'spam' : 'pending';
  const publicStatus = options.spamScore >= 80 ? 'received' : 'accepted';

  await db
    .prepare(
      `INSERT INTO contact_requests (
        request_id, public_status, delivery_status, category, locale,
        name, email, subject, message, spam_score, status_token_hash,
        admin_email_status, receipt_email_status, discord_status,
        created_at, updated_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', 'pending', ?, ?, ?)`,
    )
    .bind(
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
      expiresAt,
    )
    .run();
};

export const updateDeliveryState = async (
  db: D1Database,
  requestId: string,
  fields: {
    deliveryStatus: ContactDeliveryStatus;
    adminEmailStatus: string;
    receiptEmailStatus: string;
    discordStatus: string;
    publicStatus?: string;
    lastErrorCode?: string | null;
  },
) => {
  const now = new Date().toISOString();
  await db
    .prepare(
      `UPDATE contact_requests
       SET delivery_status = ?, admin_email_status = ?, receipt_email_status = ?,
           discord_status = ?, public_status = COALESCE(?, public_status),
           last_error_code = ?, updated_at = ?
       WHERE request_id = ?`,
    )
    .bind(
      fields.deliveryStatus,
      fields.adminEmailStatus,
      fields.receiptEmailStatus,
      fields.discordStatus,
      fields.publicStatus ?? null,
      fields.lastErrorCode ?? null,
      now,
      requestId,
    )
    .run();
};

export const getContactStatus = async (
  db: D1Database,
  requestId: string,
  statusTokenHash: string,
) =>
  db
    .prepare(
      `SELECT request_id, public_status, delivery_status, admin_email_status,
              receipt_email_status, discord_status, created_at, updated_at, expires_at
       FROM contact_requests
       WHERE request_id = ? AND status_token_hash = ? AND expires_at > ?`,
    )
    .bind(requestId, statusTokenHash, new Date().toISOString())
    .first<ContactStatusRecord>();

export const purgeExpiredContacts = async (db: D1Database) => {
  const result = await db
    .prepare('DELETE FROM contact_requests WHERE expires_at <= ?')
    .bind(new Date().toISOString())
    .run();
  return result.meta;
};
