import { describe, expect, it } from 'vitest';
import { buildResendPayload } from '../../src/worker/email-delivery';

describe('buildResendPayload', () => {
  it('adds BCC only when configured', () => {
    expect(
      buildResendPayload({
        from: 'ivuru <info.ivuru@ivrm.jp>',
        to: 'visitor@example.com',
        bcc: 'ivuruGG.info@gmail.com',
        subject: '受付完了',
        html: '<p>accepted</p>',
      }),
    ).toMatchObject({
      from: 'ivuru <info.ivuru@ivrm.jp>',
      to: ['visitor@example.com'],
      bcc: ['ivuruGG.info@gmail.com'],
    });
  });

  it('does not emit empty optional fields', () => {
    expect(
      buildResendPayload({
        from: 'ivuru <info.ivuru@ivrm.jp>',
        to: 'contact.ivuru@ivrm.jp',
        subject: 'New contact',
        html: '<p>message</p>',
      }),
    ).toEqual({
      from: 'ivuru <info.ivuru@ivrm.jp>',
      to: ['contact.ivuru@ivrm.jp'],
      subject: 'New contact',
      html: '<p>message</p>',
    });
  });
});
