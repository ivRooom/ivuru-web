import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const configPath = resolve(root, 'wrangler.jsonc');
const migrationPath = resolve(root, 'migrations/0001_contact_requests.sql');
const config = readFileSync(configPath, 'utf8');

const requiredFragments = [
  '"binding": "CONTACT_DB"',
  '"database_name": "ivuru-contact-production"',
  '"migrations_dir": "migrations"',
  '"binding": "CONTACT_DELIVERY_QUEUE"',
  '"queue": "ivuru-contact-delivery"',
  '"dead_letter_queue": "ivuru-contact-delivery-dlq"',
];

const missing = requiredFragments.filter((fragment) => !config.includes(fragment));
if (missing.length > 0) {
  throw new Error(`Cloudflare Durable Modeの設定が不足しています: ${missing.join(', ')}`);
}

if (config.includes('REPLACE_WITH_D1_DATABASE_ID')) {
  throw new Error('D1 database_idがプレースホルダーのままです。');
}

const databaseId = config.match(/"database_id"\s*:\s*"([0-9a-f-]+)"/i)?.[1];
if (!databaseId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(databaseId)) {
  throw new Error('D1 database_idがUUID形式ではありません。');
}

if (!existsSync(migrationPath)) {
  throw new Error('Contact用D1 Migrationが見つかりません。');
}

const migration = readFileSync(migrationPath, 'utf8');
if (!migration.includes('CREATE TABLE IF NOT EXISTS contact_requests')) {
  throw new Error('Contact用D1 Migrationにcontact_requestsテーブル定義がありません。');
}

console.log('Cloudflare Durable Mode設定: OK');
console.log(`D1 database_id: ${databaseId}`);
console.log('Queue: ivuru-contact-delivery');
console.log('DLQ: ivuru-contact-delivery-dlq');
