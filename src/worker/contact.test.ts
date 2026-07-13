import { describe, expect, it } from 'vitest';
import { buildDiscordMessage, escapeHtml, validateContactPayload, type ContactPayload } from './contact';

const valid: ContactPayload = {
  name: 'ivuru',
  email: 'test@example.com',
  category: 'project',
  subject: 'Website project',
  message: 'This message is long enough for the validation rule.',
  locale: 'ja',
  turnstileToken: 'token',
  website: '',
};

describe('validateContactPayload', () => {
  it('accepts a valid payload', () => {
    const result = validateContactPayload(valid);
    expect(result.errors).toEqual([]);
    expect(result.value?.email).toBe('test@example.com');
  });

  it('rejects invalid and oversized fields', () => {
    const result = validateContactPayload({ ...valid, email: 'invalid', message: 'short', category: 'unknown' });
    expect(result.value).toBeUndefined();
    expect(result.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining(['invalid_email', 'invalid_message', 'invalid_category']),
    );
  });
});

describe('notification helpers', () => {
  it('escapes HTML and disables Discord mentions', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    const discord = buildDiscordMessage(valid, 'IVR-TEST');
    expect(discord.allowed_mentions.parse).toEqual([]);
  });
});
