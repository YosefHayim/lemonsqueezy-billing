import { LoadingAnimation } from '../components/loading.js';

export async function loggedCall<T>(
  label: string,
  fn: () => Promise<T>,
  loading: LoadingAnimation
): Promise<T> {
  loading.start(label);
  try {
    const result = await fn();
    loading.stop(`[+] ${label}`);
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
