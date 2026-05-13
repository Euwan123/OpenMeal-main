function isRetryableError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();
  return (
    lower.includes('network') ||
    lower.includes('fetch') ||
    lower.includes('timeout') ||
    lower.includes('econnreset') ||
    lower.includes('etimedout') ||
    lower.includes('aborted') ||
    lower.includes('503') ||
    lower.includes('502') ||
    lower.includes('504') ||
    lower.includes('429') ||
    lower.includes('rate') ||
    lower.includes('resource exhausted')
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: { attempts?: number; delaysMs?: number[] }
): Promise<T> {
  const attempts = options?.attempts ?? 3;
  const delays = options?.delaysMs ?? [400, 1200, 2800];
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const retryable = isRetryableError(error);
      if (!retryable || i === attempts - 1) {
        throw error;
      }
      await sleep(delays[Math.min(i, delays.length - 1)] ?? 1000);
    }
  }
  throw lastError;
}
