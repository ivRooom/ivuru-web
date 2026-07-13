import { describe, expect, it, vi } from 'vitest';
import {
  isRetryableStatus,
  parseRetryAfterMs,
  RetryableDeliveryError,
  withRetry,
} from './delivery';

describe('delivery retry helpers', () => {
  it('classifies transient HTTP statuses', () => {
    expect(isRetryableStatus(408)).toBe(true);
    expect(isRetryableStatus(425)).toBe(true);
    expect(isRetryableStatus(429)).toBe(true);
    expect(isRetryableStatus(503)).toBe(true);
    expect(isRetryableStatus(400)).toBe(false);
    expect(isRetryableStatus(404)).toBe(false);
  });

  it('parses Retry-After seconds and HTTP dates', () => {
    expect(parseRetryAfterMs('2', 0)).toBe(2_000);
    expect(parseRetryAfterMs('Thu, 01 Jan 1970 00:00:03 GMT', 1_000)).toBe(2_000);
    expect(parseRetryAfterMs('invalid', 0)).toBeUndefined();
  });

  it('retries retryable failures with bounded backoff', async () => {
    const sleep = vi.fn(async () => undefined);
    let calls = 0;

    const result = await withRetry(
      async () => {
        calls += 1;
        if (calls < 3) throw new RetryableDeliveryError('temporary');
        return 'ok';
      },
      { attempts: 3, baseDelayMs: 100, maxDelayMs: 500, sleep },
    );

    expect(result).toBe('ok');
    expect(calls).toBe(3);
    expect(sleep).toHaveBeenNthCalledWith(1, 100);
    expect(sleep).toHaveBeenNthCalledWith(2, 200);
  });

  it('does not retry permanent failures', async () => {
    const operation = vi.fn(async () => {
      throw new Error('permanent');
    });

    await expect(withRetry(operation)).rejects.toThrow('permanent');
    expect(operation).toHaveBeenCalledTimes(1);
  });
});
