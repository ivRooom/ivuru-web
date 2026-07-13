import { describe, expect, it } from 'vitest';
import { calculateSpamScore, createStatusToken, hashStatusToken } from './contact-storage';
import type { ContactPayload } from './contact';

const payload = (overrides: Partial<ContactPayload> = {}): ContactPayload => ({
  name: 'Test User',
  email: 'test@example.com',
  category: 'project',
  subject: 'Development inquiry',
  message: 'I would like to discuss a small web development project in detail.',
  locale: 'en',
  turnstileToken: 'token',
  website: '',
  ...overrides,
});

describe('contact storage helpers', () => {
  it('creates an unpredictable 48-character lookup token', () => {
    const first = createStatusToken();
    const second = createStatusToken();
    expect(first).toMatch(/^[a-f0-9]{48}$/);
    expect(second).toMatch(/^[a-f0-9]{48}$/);
    expect(first).not.toBe(second);
  });

  it('hashes lookup tokens deterministically without returning the raw token', async () => {
    const first = await hashStatusToken('a'.repeat(48));
    const second = await hashStatusToken('a'.repeat(48));
    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(first).not.toContain('a'.repeat(48));
  });

  it('keeps normal messages below the spam threshold', () => {
    expect(calculateSpamScore(payload())).toBeLessThan(80);
  });

  it('scores link-heavy promotional messages as spam', () => {
    const score = calculateSpamScore(
      payload({
        subject: 'SEO service and backlink offer',
        message:
          'casino crypto SEO service https://a.example https://b.example https://c.example https://d.example https://e.example https://f.example',
      }),
    );
    expect(score).toBeGreaterThanOrEqual(80);
  });
});
