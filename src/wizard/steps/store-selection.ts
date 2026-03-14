import type { StoreInfo } from '../../types/index.js';
import { checkbox } from '@inquirer/prompts';

declare const process: {
  exit: (code?: number) => void;
};

function isExitPromptError(error: unknown): boolean {
  return error instanceof Error && error.name === 'ExitPromptError';
}

export async function stepStoreSelection(stores: StoreInfo[]): Promise<string[]> {
  if (stores.length === 0) {
    console.log('[x] No stores found. Please check your API key.');
    return [];
  }

  try {
    const selectedIds = await checkbox({
      message: 'Select stores to use:',
      choices: stores.map((store, i) => ({
        name: `${store.name} (${store.id})`,
        value: store.id,
        checked: i === 0,
      })),
    });

    if (selectedIds.length === 0) {
      console.log('[x] Please select at least one store');
      return stepStoreSelection(stores);
    }

    console.log(`[+] Selected ${selectedIds.length} store(s)`);
    return selectedIds;
  } catch (error) {
    if (isExitPromptError(error)) {
      process.exit(0);
    }
    throw error;
  }
}
