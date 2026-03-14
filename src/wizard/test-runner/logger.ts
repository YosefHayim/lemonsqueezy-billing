import { LoadingAnimation } from '../components/loading.js';

function isApiError(result: unknown): boolean {
  if (typeof result !== 'object' || result === null) return false;
  const r = result as Record<string, unknown>;
  return (typeof r['statusCode'] === 'number' && r['statusCode'] >= 400) ||
         (r['error'] !== null && r['error'] !== undefined);
}

export async function loggedCall<T>(
  label: string,
  fn: () => Promise<T>,
  loading: LoadingAnimation
): Promise<T> {
  loading.start(label);
  try {
    const result = await fn();
    const prefix = isApiError(result) ? '[x]' : '[+]';
    loading.stop(`${prefix} ${label}`);
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    loading.stop(`[x] ${label} failed`);
    console.log(
      JSON.stringify(
        error instanceof Error
          ? { message: error.message, stack: error.stack, name: error.name }
          : error,
        null,
        2
      )
    );
    throw error;
  }
}
