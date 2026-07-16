import { describe, expect, it } from 'vitest';
import { buildXProfilePayload } from '../../src/worker/x-profile';

describe('buildXProfilePayload', () => {
  it('X APIの公開プロフィールを画面表示用データへ変換する', () => {
    const result = buildXProfilePayload(
      {
        data: {
          id: '123',
          username: 'ivuruGG',
          name: 'いゔる。',
          description: 'Developer / Gamer / Community',
          profile_image_url: 'https://pbs.twimg.com/profile_images/example_normal.jpg',
          profile_banner_url: 'https://pbs.twimg.com/profile_banners/example/banner',
          verified: true,
        },
      },
      'ivuruGG',
    );

    expect(result).toMatchObject({
      ok: true,
      source: 'x',
      username: 'ivuruGG',
      name: 'いゔる。',
      description: 'Developer / Gamer / Community',
      profileImageUrl: 'https://pbs.twimg.com/profile_images/example_400x400.jpg',
      profileBannerUrl: 'https://pbs.twimg.com/profile_banners/example/banner',
      profileUrl: 'https://x.com/ivuruGG',
      verified: true,
    });
  });

  it('必須プロフィール情報がないレスポンスは利用しない', () => {
    expect(buildXProfilePayload({ data: { username: 'ivuruGG' } }, 'ivuruGG')).toBeNull();
    expect(buildXProfilePayload({}, 'ivuruGG')).toBeNull();
  });

  it('空の自己紹介と画像には安全な既定値を使う', () => {
    const result = buildXProfilePayload(
      { data: { username: 'ivuruGG', name: 'いゔる。', description: '  ' } },
      'ivuruGG',
    );

    expect(result?.description).toBe('Developer / Gamer / Community operator');
    expect(result?.profileImageUrl).toBe('/assets/images/ivuru-profile-fallback.png');
    expect(result?.profileBannerUrl).toBeNull();
  });
});
