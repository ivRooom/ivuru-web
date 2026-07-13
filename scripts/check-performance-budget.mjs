import { readdir, stat } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const limits = {
  total: 20 * 1024 * 1024,
  javascript: 3 * 1024 * 1024,
  css: 700 * 1024,
  largestAsset: 4 * 1024 * 1024,
};

const files = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else {
      const info = await stat(path);
      files.push({ path, size: info.size });
    }
  }
}

const format = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`;

try {
  await walk(root);
} catch (error) {
  console.error('dist/ を走査できません。先に npm run build を実行してください。');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const total = files.reduce((sum, file) => sum + file.size, 0);
const javascript = files
  .filter((file) => ['.js', '.mjs'].includes(extname(file.path)))
  .reduce((sum, file) => sum + file.size, 0);
const css = files
  .filter((file) => extname(file.path) === '.css')
  .reduce((sum, file) => sum + file.size, 0);
const largest = files.toSorted((a, b) => b.size - a.size)[0];

const rows = [
  ['dist total', total, limits.total],
  ['JavaScript total', javascript, limits.javascript],
  ['CSS total', css, limits.css],
  [
    `largest asset (${largest ? relative(root, largest.path) : 'none'})`,
    largest?.size ?? 0,
    limits.largestAsset,
  ],
];

console.log('| Budget | Actual | Limit | Result |');
console.log('| --- | ---: | ---: | --- |');
let failed = false;
for (const [label, actual, limit] of rows) {
  const pass = actual <= limit;
  failed ||= !pass;
  console.log(`| ${label} | ${format(actual)} | ${format(limit)} | ${pass ? 'PASS' : 'FAIL'} |`);
}

if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFile } = await import('node:fs/promises');
  const markdown = [
    '## Performance Budget',
    '',
    '| Budget | Actual | Limit | Result |',
    '| --- | ---: | ---: | --- |',
    ...rows.map(
      ([label, actual, limit]) =>
        `| ${label} | ${format(actual)} | ${format(limit)} | ${actual <= limit ? 'PASS' : 'FAIL'} |`,
    ),
    '',
  ].join('\n');
  await appendFile(process.env.GITHUB_STEP_SUMMARY, markdown);
}

if (failed) process.exit(1);
