import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const netlify = readFileSync(resolve(root, 'netlify.toml'), 'utf8');
const wrangler = readFileSync(resolve(root, 'wrangler.jsonc'), 'utf8');
const siteConfig = readFileSync(resolve(root, 'src/data/site-config.ts'), 'utf8');
const apiHelper = readFileSync(resolve(root, 'src/lib/contact-api.ts'), 'utf8');
const contactTerminal = readFileSync(
  resolve(root, 'src/components/contact/ContactTerminal.tsx'),
  'utf8',
);
const contactStatusTerminal = readFileSync(
  resolve(root, 'src/components/contact/ContactStatusTerminal.tsx'),
  'utf8',
);

const requiredNetlifyFragments = [
  'SITE_URL = "https://ivuru.ivrm.jp"',
  'PUBLIC_CONTACT_API_ORIGIN = "https://ivurugg.ivrm.jp"',
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
  throw new Error(`NetlifyのContact API設定が不足しています: ${missingNetlify.join(', ')}`);
}

if (netlify.includes('from = "/api/*"')) {
  throw new Error('Netlify proxyは接続元IPを共有するため、Contact API経路には使用できません。');
}

if (missingWrangler.length > 0) {
  throw new Error(`CloudflareのContact API設定が不足しています: ${missingWrangler.join(', ')}`);
}

if (!siteConfig.includes("import.meta.env.SITE_URL ?? 'https://ivuru.ivrm.jp'")) {
  throw new Error('siteConfigの本番フォールバックURLがNetlify本番URLと一致していません。');
}

if (!apiHelper.includes('PUBLIC_CONTACT_API_ORIGIN')) {
  throw new Error('Contact API URLヘルパーが公開Worker Originを参照していません。');
}

if (!contactTerminal.includes("contactApiUrl('/api/contact')")) {
  throw new Error('Contact送信UIが公開Worker URLを利用していません。');
}

if (!contactStatusTerminal.includes("contactApiUrl('/api/contact/status')")) {
  throw new Error('Contact状態照会UIが公開Worker URLを利用していません。');
}

console.log('Deployment routing設定: OK');
console.log('Frontend: https://ivuru.ivrm.jp');
console.log('Contact API: https://ivurugg.ivrm.jp/api/*');
console.log('Browser to Worker direct CORS: enabled');
console.log('Netlify /api/* proxy: disabled');
