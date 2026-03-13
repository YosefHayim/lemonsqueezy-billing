import { createBilling } from '@core/index.js';
import type { StoreInfo } from '../../types/index.js';
import { LoadingAnimation } from '../components/loading.js';
import { input, checkbox } from '@inquirer/prompts';
import 'dotenv/config';

declare const process: {
  env: Record<string, string | undefined>;
  exit: (code?: number) => void;
};

function isExitPromptError(error: unknown): boolean {
  return error instanceof Error && error.name === 'ExitPromptError';
}

interface EnvApiKey {
  label: string;
  envName: string;
  value: string;
  isSandbox: boolean;
}

function getAvailableApiKeys(): EnvApiKey[] {
  const keys: EnvApiKey[] = [];

  if (process.env.LS_TEST_API_KEY) {
    keys.push({
      label: 'Sandbox API Key',
      envName: 'LS_TEST_API_KEY',
      value: process.env.LS_TEST_API_KEY,
      isSandbox: true,
    });
  }
  if (process.env.LS_LIVE_API_KEY) {
    keys.push({
      label: 'Production API Key',
      envName: 'LS_LIVE_API_KEY',
      value: process.env.LS_LIVE_API_KEY,
      isSandbox: false,
    });
  }

  return keys;
}

export async function stepApiKey(
  loading: LoadingAnimation
): Promise<{ apiKey: string; isSandbox: boolean; stores: StoreInfo[] }> {
  const availableKeys = getAvailableApiKeys();
  let apiKey: string | undefined;
  let isSandbox = false;

  try {
    if (availableKeys.length === 1) {
      console.log(`\n[+] Found ${availableKeys[0].envName} in environment`);
      apiKey = availableKeys[0].value;
      isSandbox = availableKeys[0].isSandbox;
    } else if (availableKeys.length > 1) {
      const selected = await checkbox({
        message: 'Choose API key:',
        choices: availableKeys.map((k, i) => ({
          name: `${k.label} (${k.envName})`,
          value: k.envName,
          checked: i === 0,
        })),
      });

      const chosenName = selected[0] ?? availableKeys[0].envName;
      const chosen = availableKeys.find((k) => k.envName === chosenName) ?? availableKeys[0];
      apiKey = chosen.value;
      isSandbox = chosen.isSandbox;
    }

    if (!apiKey) {
      apiKey = await input({
        message: 'Enter your Lemon Squeezy API key:',
      });
    }

    if (!apiKey) {
      console.log('[x] API key is required');
      return stepApiKey(loading);
    }

    loading.start('Validating API key');

    const billing = await createBilling({
      apiKey,
      callbacks: { onPurchase: async () => {} },
    });

    loading.stop(`[+] Found ${billing.stores.length} store(s)`);
    return { apiKey, isSandbox, stores: billing.stores };
  } catch (error) {
    if (isExitPromptError(error)) {
      process.exit(0);
    }
    loading.stop('[x] Invalid API key. Please try again.');
    return stepApiKey(loading);
  }
}
