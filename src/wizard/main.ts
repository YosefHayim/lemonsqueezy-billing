import { randomBytes } from 'node:crypto';
import { banner } from './components/banner.js';
import { LoadingAnimation } from './components/loading.js';
import { stepApiKey } from './steps/api-key.js';
import { stepStoreSelection } from './steps/store-selection.js';
import { stepProductSelection } from './steps/product-selection.js';
import { stepWebhookSetup } from './steps/webhook-setup.js';
import { stepConfiguration } from './steps/configuration.js';
import { stepGenerateFiles } from './steps/generate-files.js';
import { runAllPhases } from './test-runner/phases.js';
import type { WizardState } from './state.js';
import type { TestEnvConfig } from './test-runner/config.js';
import { confirm } from '@inquirer/prompts';
import 'dotenv/config';

declare const process: {
  env: Record<string, string | undefined>;
  exit: (code?: number) => void;
  cwd: () => string;
};

function isExitPromptError(error: unknown): boolean {
  return error instanceof Error && error.name === 'ExitPromptError';
}

function generateSecret(): string {
  return 'ls_'.concat(randomBytes(18).toString('hex'));
}

export async function runWizard(): Promise<void> {
  console.log(banner);
  const loading = new LoadingAnimation();

  try {
    const { apiKey, isSandbox, stores } = await stepApiKey(loading);

    const selectedStoreIds = await stepStoreSelection(stores);

    if (selectedStoreIds.length === 0) {
      console.log('[x] No stores selected. Wizard cannot continue.');
      process.exit(1);
    }

    const { products, selectedProductIds } = await stepProductSelection(selectedStoreIds, loading);

    const { webhookUrl, webhookEvents } = await stepWebhookSetup();

    const defaults = {
      cachePath: './billing-cache.json',
      webhookSecret: generateSecret(),
      loggerPath: './billing.log',
    };
    const { cachePath, webhookSecret, loggerPath } = await stepConfiguration(defaults);

    const state: WizardState = {
      apiKey,
      isSandbox,
      stores,
      selectedStoreIds,
      products,
      selectedProductIds,
      webhookUrl,
      webhookEvents,
      cachePath,
      webhookSecret,
      loggerPath,
    };

    await stepGenerateFiles(state, loading);

    const runTests = await confirm({
      message: `Run API lifecycle test phases? (${isSandbox ? 'Sandbox' : 'Production'})`,
      default: false,
    });

    if (runTests) {
      const variantId = selectedProductIds[0];
      if (!variantId) {
        console.log('[-] Skipping lifecycle tests: no product variant selected.');
      } else {
        const config: TestEnvConfig = {
          isSandbox,
          apiKey,
          storeId: selectedStoreIds[0] ?? '',
          variantId,
          orderId: process.env['LS_TEST_ORDER_ID'],
          subscriptionId: process.env['LS_TEST_SUBSCRIPTION_ID'],
          licenseKey: process.env['LS_TEST_LICENSE_KEY'],
        };
        await runAllPhases(config, loading);
      }
    }

    console.log('\n[+] Wizard complete!');
  } catch (error) {
    if (isExitPromptError(error)) {
      console.log('\n[x] Wizard cancelled');
      process.exit(0);
    }
    console.error('\n[x] Error:', error);
    process.exit(1);
  }
}

export class BillingWizard {
  async run(): Promise<void> {
    await runWizard();
  }
}
