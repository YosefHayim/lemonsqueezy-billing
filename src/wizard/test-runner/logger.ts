import { LoadingAnimation } from '../components/loading.js';

function isApiError(result: unknown): boolean {
  if (typeof result !== 'object' || result === null) return false;
  const r = result as Record<string, unknown>;
  return (typeof r['statusCode'] === 'number' && r['statusCode'] >= 400) ||
         (r['error'] !== null && r['error'] !== undefined);
}

function sliceResult(result: unknown): string {
  if (typeof result !== 'object' || result === null) return String(result);
  const r = result as Record<string, unknown>;
  const statusCode = r['statusCode'];
  const data = r['data'] as Record<string, unknown> | undefined;

  if (!data) {
    return JSON.stringify({ statusCode, ...Object.fromEntries(Object.entries(r).slice(0, 4)) }, null, 2);
  }

  const inner = data['data'];
  const meta = data['meta'] as Record<string, unknown> | undefined;

  if (Array.isArray(inner)) {
    const count = inner.length;
    const first = inner[0] as Record<string, unknown> | undefined;
    const sample = first
      ? { id: first['id'], type: first['type'] }
      : null;
    const metaSlice = meta ? { page: meta['currentPage'], total: meta['total'] } : undefined;
    return JSON.stringify({ statusCode, count, sample, meta: metaSlice }, null, 2);
  }

  if (inner && typeof inner === 'object') {
    const res = inner as Record<string, unknown>;
    const attrs = res['attributes'] as Record<string, unknown> | undefined;
    const attrSlice = attrs
      ? Object.fromEntries(Object.entries(attrs).slice(0, 5))
      : undefined;
    return JSON.stringify({ statusCode, id: res['id'], type: res['type'], attributes: attrSlice }, null, 2);
  }

  return JSON.stringify({ statusCode }, null, 2);
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
    console.log(sliceResult(result));
    return result;
  } catch (error) {
    loading.stop(`[x] ${label} failed`);
    const errSlice = error instanceof Error
      ? { message: error.message, name: error.name }
      : { error: String(error) };
    console.log(JSON.stringify(errSlice, null, 2));
    throw error;
  }
}
