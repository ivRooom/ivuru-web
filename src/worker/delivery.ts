export type RetryOptions = {
  attempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  sleep?: (milliseconds: number) => Promise<void>;
};

export class RetryableDeliveryError extends Error {
  retryAfterMs?: number;

  constructor(message: string, retryAfterMs?: number) {
    super(message);
    this.name = 'RetryableDeliveryError';
    this.retryAfterMs = retryAfterMs;
  }
}

export const isRetryableStatus = (status: number) =>
  status === 408 || status === 425 || status === 429 || status >= 500;

export const parseRetryAfterMs = (value: string | null, now = Date.now()) => {
  if (!value) return undefined;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1_000;

  const date = Date.parse(value);
  if (Number.isNaN(date)) return undefined;
  return Math.max(0, date - now);
};

const defaultSleep = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export async function withRetry<T>(operation: (attempt: number) => Promise<T>, options: RetryOptions = {}) {
  const attempts = Math.max(1, options.attempts ?? 3);
  const baseDelayMs = Math.max(0, options.baseDelayMs ?? 250);
  const maxDelayMs = Math.max(baseDelayMs, options.maxDelayMs ?? 2_000);
  const sleep = options.sleep ?? defaultSleep;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      if (!(error instanceof RetryableDeliveryError) || attempt === attempts) throw error;

      const exponentialDelay = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
      const requestedDelay = error.retryAfterMs ?? exponentialDelay;
      await sleep(Math.min(maxDelayMs, Math.max(0, requestedDelay)));
    }
  }

  throw new Error('Retry loop exited unexpectedly.');
}
