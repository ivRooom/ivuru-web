import { describe, expect, it } from 'vitest';
import { expectedTurnstileHostname } from './worker';

const env = {
  ALLOWED_ORIGINS: 'https://ivurugg.ivrm.jp,https://ivuru.ivrm.jp',
} as Parameters<typeof expectedTurnstileHostname>[1];

describe('expectedTurnstileHostname', () => {
  it('許可済みブラウザOriginのhostnameを検証対象にする', () => {
    const request = new Request('https://ivurugg.ivrm.jp/api/contact', {
      headers: { origin: 'https://ivuru.ivrm.jp' },
    });

    expect(expectedTurnstileHostname(request, env)).toBe('ivuru.ivrm.jp');
  });

  it('未許可OriginはWorker自身のhostnameへフォールバックする', () => {
    const request = new Request('https://ivurugg.ivrm.jp/api/contact', {
      headers: { origin: 'https://attacker.example' },
    });

    expect(expectedTurnstileHostname(request, env)).toBe('ivurugg.ivrm.jp');
  });

  it('Cloudflare直接アクセスはWorker自身のhostnameを利用する', () => {
    const request = new Request('https://ivurugg.ivrm.jp/api/contact');

    expect(expectedTurnstileHostname(request, env)).toBe('ivurugg.ivrm.jp');
  });
});
