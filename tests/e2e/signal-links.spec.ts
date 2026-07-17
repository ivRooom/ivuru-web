import { expect, test } from '@playwright/test';

const prepareHome = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => {
    localStorage.setItem('ivuru-theme', 'dark');
    localStorage.setItem('ivuru-locale', 'ja');
    sessionStorage.setItem('ivuru-intro-seen', '1');
  });
};

test('Spotifyは操作後だけ読み込み、確認済み公開リンクを表示する', async ({ page }) => {
  await prepareHome(page);
  await page.route('https://open.spotify.com/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>Spotify</body></html>' });
  });
  await page.goto('/');

  const section = page.locator('.signal-links-section');
  await section.scrollIntoViewIfNeeded();
  await expect(section).toBeVisible();

  await expect(section.locator('iframe')).toHaveCount(0);
  await expect(
    section.getByRole('link', { name: /Spotifyで開く|Open in Spotify|Spotify에서 열기/i }),
  ).toHaveAttribute(
    'href',
    'https://open.spotify.com/playlist/37i9dQZEVXdgE4Qkd43TnK',
  );

  await section
    .getByRole('button', { name: /プレイリストを表示|Show playlist|플레이리스트 표시/i })
    .click();
  const iframe = section.locator('iframe');
  await expect(iframe).toHaveCount(1);
  await expect(iframe).toHaveAttribute(
    'src',
    /open\.spotify\.com\/embed\/playlist\/37i9dQZEVXdgE4Qkd43TnK/,
  );
  await expect(iframe).toHaveAttribute('loading', 'lazy');

  await expect(section.getByRole('link', { name: /GITHUB/i })).toHaveAttribute(
    'href',
    'https://github.com/mizzz-dev',
  );
  await expect(section.getByRole('link', { name: /ALL LINKS/i })).toHaveAttribute(
    'href',
    'https://lit.link/ivuruGG',
  );
  await expect(section.getByRole('link', { name: /^X/i })).toHaveAttribute(
    'href',
    'https://x.com/ivuruGG',
  );
});
