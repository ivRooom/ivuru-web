import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const [baseURL = 'http://127.0.0.1:4321', output = 'visual-output'] = process.argv.slice(2);
await mkdir(output, { recursive: true });

const cases = [
  { name: 'home-desktop-dark', path: '/', width: 1440, height: 900, theme: 'dark' },
  { name: 'home-mobile-dark', path: '/', width: 390, height: 844, theme: 'dark' },
  { name: 'profile-tablet-dark', path: '/profile', width: 1024, height: 768, theme: 'dark' },
  { name: 'profile-mobile-dark', path: '/profile', width: 390, height: 844, theme: 'dark' },
  { name: 'portfolio-desktop-light', path: '/portfolio', width: 1440, height: 900, theme: 'light' },
  { name: 'contact-desktop-dark', path: '/contact', width: 1440, height: 900, theme: 'dark' },
  { name: 'contact-mobile-dark', path: '/contact', width: 390, height: 844, theme: 'dark' },
];

const browser = await chromium.launch();
try {
  for (const item of cases) {
    const context = await browser.newContext({
      viewport: { width: item.width, height: item.height },
      reducedMotion: 'reduce',
      colorScheme: item.theme,
    });
    await context.addInitScript(
      ({ theme }) => {
        localStorage.setItem('ivuru-theme', theme);
        localStorage.setItem('ivuru-locale', 'ja');
        sessionStorage.setItem('ivuru-intro-seen', '1');
      },
      { theme: item.theme },
    );
    await context.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') await route.continue();
      else await route.abort();
    });
    const page = await context.newPage();
    await page.goto(`${baseURL}${item.path}`, { waitUntil: 'networkidle' });
    await page.addStyleTag({
      content: `
      *, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }
      .noise, .world-atmosphere { opacity: 0 !important; }
    `,
    });
    await page
      .locator('.world-loader')
      .waitFor({ state: 'hidden', timeout: 3000 })
      .catch(() => undefined);
    await page.screenshot({ path: join(output, `${item.name}.png`), animations: 'disabled' });
    await context.close();
  }
} finally {
  await browser.close();
}
