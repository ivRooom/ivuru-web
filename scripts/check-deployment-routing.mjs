import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const netlify = readFileSync(resolve(root, 'netlify.toml'), 'utf8');
const wrangler = readFileSync(resolve(root, 'wrangler.jsonc'), 'utf8');
const siteConfig = readFileSync(resolve(root, 'src/data/site-config.ts'), 'utf8');

const requiredNetlifyFragments = [
  'SITE_URL = "https://ivuru.ivrm.jp"',
  'from = "/api/*"',
  'to = "https://ivurugg.ivrm.jp/api/:splat"',
  'status = 200',
  'force = true',
];

const requiredWranglerFragments = [
  '"main": "./src/worker-entry.ts"',
  '"ALLOWED_ORIGINS": "https://ivurugg.ivrm.jp,https://ivuru.ivrm.jp"',
];

const missingNetlify = requiredNetlifyFragments.filter((fragment) => !netlify.includes(fragment));
const missingWrangler = requiredWranglerFragments.filter(
  (fragment) => !wrangler.includes(fragment),
);

if (missingNetlify.length > 0) {
  throw new Error(`NetlifyのContact API経路設定が不足しています: ${missingNetlify.join(', ')}`);
}

if (missingWrangler.length > 0) {
  throw new Error(`CloudflareのContact API経路設定が不足しています: ${missingWrangler.join(', ')}`);
}

if (!siteConfig.includes("import.meta.env.SITE_URL ?? 'https://ivuru.ivrm.jp'")) {
  throw new Error('siteConfigの本番フォールバックURLがNetlify本番URLと一致していません。');
}

console.log('Deployment routing設定: OK');
console.log('Frontend: https://ivuru.ivrm.jp');
console.log('Contact API: https://ivurugg.ivrm.jp/api/*');
console.log('Netlify /api/* proxy: enabled');
