import { describe, expect, it } from 'vitest';
import { PayloadTooLargeError, readTextBodyWithLimit } from '../../src/worker/request-body';

const streamRequest = (chunks: string[], contentLength?: number) => {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  const headers = new Headers({ 'content-type': 'application/json' });
  if (contentLength !== undefined) headers.set('content-length', String(contentLength));

  return new Request('https://ivurugg.ivrm.jp/api/contact', {
    method: 'POST',
    headers,
    body,
    duplex: 'half',
  } as RequestInit & { duplex: 'half' });
};

describe('readTextBodyWithLimit', () => {
  it('reads a body that stays within the byte limit', async () => {
    const request = streamRequest(['{"name":"ivu', 'ru"}']);
    await expect(readTextBodyWithLimit(request, 64)).resolves.toBe('{"name":"ivuru"}');
  });

  it('rejects an oversized declared content length before reading', async () => {
    const request = streamRequest(['{}'], 24_001);
    await expect(readTextBodyWithLimit(request, 24_000)).rejects.toBeInstanceOf(
      PayloadTooLargeError,
    );
  });

  it('stops a streamed body when cumulative chunks exceed the limit', async () => {
    const request = streamRequest(['1234', '5678', '90']);
    await expect(readTextBodyWithLimit(request, 8)).rejects.toBeInstanceOf(PayloadTooLargeError);
  });

  it('counts UTF-8 bytes instead of JavaScript characters', async () => {
    const request = streamRequest(['あい']);
    await expect(readTextBodyWithLimit(request, 5)).rejects.toBeInstanceOf(PayloadTooLargeError);
  });
});
