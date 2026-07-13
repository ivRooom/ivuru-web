CREATE TABLE IF NOT EXISTS contact_requests (
  request_id TEXT PRIMARY KEY,
  public_status TEXT NOT NULL DEFAULT 'accepted',
  delivery_status TEXT NOT NULL DEFAULT 'pending',
  category TEXT NOT NULL,
  locale TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  spam_score INTEGER NOT NULL DEFAULT 0 CHECK (spam_score BETWEEN 0 AND 100),
  status_token_hash TEXT NOT NULL,
  admin_email_status TEXT NOT NULL DEFAULT 'pending',
  receipt_email_status TEXT NOT NULL DEFAULT 'pending',
  discord_status TEXT NOT NULL DEFAULT 'pending',
  last_error_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_requests_status_token
  ON contact_requests(request_id, status_token_hash);

CREATE INDEX IF NOT EXISTS idx_contact_requests_delivery_status
  ON contact_requests(delivery_status, updated_at);

CREATE INDEX IF NOT EXISTS idx_contact_requests_expires_at
  ON contact_requests(expires_at);
