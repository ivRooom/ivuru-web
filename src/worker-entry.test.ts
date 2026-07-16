import { describe, expect, it } from 'vitest';
import { allowedCorsOrigin, buildCorsHeaders } from './worker-entry';

const env = {
  ALLOWED_ORIGINS: 'https://ivurugg.ivrm.jp,https://ivuru.ivrm.jp',
};

describe('Contact API CORS', () => {
  it('Netlify本番Originを許可する', () => {
    const request = new Request('https://ivurugg.ivrm.jp/api/contact', {
      method: 'POST',
      headers: { origin: 'https://ivuru.ivrm.jp' },
    });

    expect(allowedCorsOrigin(request, env)).toBe('https://ivuru.ivrm.jp');
    expect(buildCorsHeaders(request, env)).toEqual({
      'access-control-allow-origin': 'https://ivuru.ivrm.jp',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': 'accept, content-type',
      'access-control-max-age': '86400',
      vary: 'Origin',
    });
  });

  it('Cloudflare直接Originも許可する', () => {
    const request = new Request('https://ivurugg.ivrm.jp/api/contact', {
      headers: { origin: 'https://ivurugg.ivrm.jp' },
    });

    expect(allowedCorsOrigin(request, env)).toBe('https://ivurugg.ivrm.jp');
  });

  it('未許可OriginとOriginなしのリクエストへCORSを付与しない', () => {
    const attacker = new Request('https://ivurugg.ivrm.jp/api/contact', {
      headers: { origin: 'https://attacker.example' },
    });
    const serverToServer = new Request('https://ivurugg.ivrm.jp/api/contact');

    expect(allowedCorsOrigin(attacker, env)).toBeNull();
    expect(buildCorsHeaders(attacker, env)).toBeNull();
    expect(allowedCorsOrigin(serverToServer, env)).toBeNull();
  });
});
