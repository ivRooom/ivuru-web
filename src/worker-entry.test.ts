import { describe, expect, it } from 'vitest';
import { normalizeApiProxyRequest } from './worker-entry';

const env = {
  ALLOWED_ORIGINS: 'https://ivurugg.ivrm.jp,https://ivuru.ivrm.jp',
};

describe('normalizeApiProxyRequest', () => {
  it('許可済みのNetlify公開OriginへAPIリクエストURLを正規化する', () => {
    const request = new Request('https://ivurugg.ivrm.jp/api/contact', {
      method: 'POST',
      headers: {
        origin: 'https://ivuru.ivrm.jp',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ test: true }),
    });

    const normalized = normalizeApiProxyRequest(request, env);

    expect(normalized.url).toBe('https://ivuru.ivrm.jp/api/contact');
    expect(normalized.method).toBe('POST');
    expect(normalized.headers.get('origin')).toBe('https://ivuru.ivrm.jp');
    expect(normalized.headers.get('content-type')).toBe('application/json');
  });

  it('未許可OriginのURLは書き換えない', () => {
    const request = new Request('https://ivurugg.ivrm.jp/api/contact', {
      method: 'POST',
      headers: { origin: 'https://attacker.example' },
      body: '{}',
    });

    expect(normalizeApiProxyRequest(request, env)).toBe(request);
  });

  it('API以外のStatic Assetsリクエストは書き換えない', () => {
    const request = new Request('https://ivurugg.ivrm.jp/profile/', {
      headers: { origin: 'https://ivuru.ivrm.jp' },
    });

    expect(normalizeApiProxyRequest(request, env)).toBe(request);
  });

  it('同一OriginのCloudflare直接アクセスはそのまま処理する', () => {
    const request = new Request('https://ivurugg.ivrm.jp/api/contact', {
      headers: { origin: 'https://ivurugg.ivrm.jp' },
    });

    expect(normalizeApiProxyRequest(request, env)).toBe(request);
  });
});
