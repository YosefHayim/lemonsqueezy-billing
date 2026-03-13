const DEFAULT_MAX_RETRIES = 3;
const BASE_DELAY_MS = 5000;
const BACKOFF_FACTOR = 5;

interface RetryableError {
  status?: number;
  message?: string;
  cause?: unknown;
}

function isRetryable(error: RetryableError): boolean {
  const status = error.status;
  if (!status) return false;
  return status === 429 || status >= 500;
}

function getDelay(attempt: number): number {
  return BASE_DELAY_MS * Math.pow(BACKOFF_FACTOR, attempt);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  _label: string,
  maxRetries: number = DEFAULT_MAX_RETRIES
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const error = err as RetryableError;
      lastError = err as Error;

      if (attempt < maxRetries && isRetryable(error)) {
        const delay = getDelay(attempt);
        await sleep(delay);
        continue;
      }

      throw lastError;
    }
  }

  throw lastError;
}
