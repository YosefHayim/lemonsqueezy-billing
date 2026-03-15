import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { writeFile, mkdir } from 'node:fs/promises';
import { loadWizardConfig, runWizard } from 'grimoire-wizard';
import { createBilling } from '../core/index.js';
import { fetchProducts, flattenPlans } from '../core/plans.js';
import { DEFAULT_CACHE_PATH, DEFAULT_LOG_PATH, BILLING_DIR, WIZARD_CONFIG_FILE, WIZARD_EXAMPLE_FILE } from '../core/paths.js';
import { generateConfigContent } from './utils/config-content.js';
import { generateExampleContent } from './utils/example-content.js';
import { runAllPhases } from './test-runner/phases.js';
import { LoadingAnimation } from './components/loading.js';
import type { WizardState } from './state.js';
import type { StoreInfo, CachedProduct } from '../types/index.js';
import type { TestEnvConfig } from './test-runner/config.js';
import 'dotenv/config';

declare const process: {
  env: Record<string, string | undefined>;
  exit: (code?: number) => void;
  cwd: () => string;
};

// ─── Env helpers ────────────────────────────────────────────────

function envId(key: string): string | undefined {
  const value = process.env[key];
  if (!value || /^your_|_here$/.test(value)) return undefined;
  return value;
}

function generateSecret(): string {
  return 'ls_'.concat(randomBytes(18).toString('hex'));
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
    keys.push({ label: 'Sandbox API Key', envName: 'LS_TEST_API_KEY', value: process.env.LS_TEST_API_KEY, isSandbox: true });
  }
  if (process.env.LS_LIVE_API_KEY) {
    keys.push({ label: 'Production API Key', envName: 'LS_LIVE_API_KEY', value: process.env.LS_LIVE_API_KEY, isSandbox: false });
  }
  return keys;
}

// ─── Runtime state (populated during wizard) ────────────────────

let validatedStores: StoreInfo[] = [];
let allProducts: CachedProduct[] = [];
let isSandbox = false;

// ─── Main ───────────────────────────────────────────────────────

export async function runGrimoireWizard(): Promise<void> {
  const configPath = new URL('./wizard-config.yaml', import.meta.url).pathname;
  const config = await loadWizardConfig(configPath);

  const availableKeys = getAvailableApiKeys();
  const templateAnswers: Record<string, unknown> = {
    'webhook-secret': generateSecret(),
  };

  // When only one env key exists, auto-select it and skip the source step
  if (availableKeys.length === 1) {
    console.log(`\n[+] Found ${availableKeys[0].envName} in environment`);
    templateAnswers['api-key-source'] = availableKeys[0].envName;
    templateAnswers['api-key'] = availableKeys[0].value;
    isSandbox = availableKeys[0].isSandbox;
  }

  try {
    const answers = await runWizard(config, {
      configFilePath: configPath,
      templateAnswers,

      onBeforeStep: async (stepId, step, wizardState) => {
        if (stepId === 'api-key-source' && step.type === 'select') {
          if (availableKeys.length > 0) {
            step.options = [
              ...availableKeys.map((k) => ({
                value: k.envName,
                label: `${k.label} (${k.envName})`,
              })),
              { value: 'manual', label: 'Enter manually' },
            ];
          }
        }

        if (stepId === 'store-selection' && step.type === 'multiselect') {
          if (validatedStores.length > 0) {
            console.log(`  [+] Found ${validatedStores.length} store(s)`);
            step.options = validatedStores.map((store) => ({
              value: store.id,
              label: `${store.name} (${store.id})`,
            }));
          } else {
            step.options = [{ value: '__invalid__', label: 'No stores found — check API key' }];
          }
        }

        if (stepId === 'product-selection' && step.type === 'multiselect') {
          const storeIds = (wizardState.answers['store-selection'] as string[]) ?? [];

          allProducts = [];
          for (const storeId of storeIds) {
            try {
              const products = await fetchProducts(storeId);
              allProducts.push(...products);
            } catch {
              console.log(`  [x] Failed to fetch products for store ${storeId}`);
            }
          }

          if (allProducts.length === 0) {
            console.log('  [x] No products found. Create products in your Lemon Squeezy dashboard.');
            step.options = [{ value: '__none__', label: 'No products found' }];
            return;
          }

          const plans = flattenPlans(allProducts);
          if (plans.length === 0) {
            console.log('  [x] No product variants found.');
            step.options = [{ value: '__none__', label: 'No variants found' }];
            return;
          }

          step.options = plans.map((plan) => ({
            value: plan.variantId,
            label: `${plan.name} - ${plan.variantName} (${plan.priceFormatted})`,
          }));
        }
      },

      onAfterStep: async (_stepId, value, wizardState) => {
        if (_stepId === 'api-key-source' && value !== 'manual') {
          const envKey = availableKeys.find((k) => k.envName === value);
          if (envKey) {
            wizardState.answers['api-key'] = envKey.value;
            isSandbox = envKey.isSandbox;

            try {
              const billing = await createBilling({
                apiKey: envKey.value,
                callbacks: { onPurchase: async () => {} },
              });
              validatedStores = billing.stores;
              console.log(`  [+] Validated ${envKey.envName} — found ${billing.stores.length} store(s)`);
            } catch {
              console.log(`  [x] API key validation failed for ${envKey.envName}`);
            }
          }
        }
      },

      asyncValidate: async (stepId, value, currentAnswers) => {
        if (stepId === 'api-key') {
          const apiKey = value as string;
          if (!apiKey) return 'API key is required';

          try {
            const billing = await createBilling({
              apiKey,
              callbacks: { onPurchase: async () => {} },
            });
            validatedStores = billing.stores;
            return null;
          } catch {
            return 'API key validation failed. Please enter a valid key.';
          }
        }

        if (stepId === 'store-selection') {
          const selected = value as string[];
          if (!selected?.length || selected.includes('__invalid__')) {
            return 'Please select at least one store';
          }
          return null;
        }

        if (stepId === 'product-selection') {
          const selected = value as string[];
          if (!selected?.length || selected.includes('__none__')) {
            return 'Please select at least one product';
          }
          return null;
        }

        if (stepId === 'webhook-events') {
          const selected = value as string[];
          if (!selected?.length) {
            return 'Please select at least one event';
          }
          return null;
        }

        return null;
      },
    });

    // ─── Post-wizard: Generate files ────────────────────────────

    const shouldGenerate = answers['generate-files'] as boolean;
    if (!shouldGenerate) {
      console.log('[-] Exiting without generating files');
      return;
    }

    const selectedStoreIds = answers['store-selection'] as string[];
    const selectedProductIds = answers['product-selection'] as string[];
    const webhookUrl = answers['create-webhook'] ? (answers['webhook-url'] as string)?.trim() : undefined;
    const webhookEvents = (answers['webhook-events'] as string[]) ?? [];

    const state: WizardState = {
      apiKey: answers['api-key'] as string,
      isSandbox,
      stores: validatedStores,
      selectedStoreIds,
      products: allProducts,
      selectedProductIds,
      webhookUrl,
      webhookEvents,
      cachePath: (answers['cache-path'] as string) || DEFAULT_CACHE_PATH,
      webhookSecret: (answers['webhook-secret'] as string) || generateSecret(),
      loggerPath: (answers['logger-path'] as string) || DEFAULT_LOG_PATH,
    };

    const configContent = generateConfigContent(state);
    const exampleContent = generateExampleContent(state);

    const billingDir = resolve(process.cwd(), BILLING_DIR);
    const configFilePath = resolve(process.cwd(), WIZARD_CONFIG_FILE);
    const examplePath = resolve(process.cwd(), WIZARD_EXAMPLE_FILE);

    await mkdir(billingDir, { recursive: true });
    await Promise.all([
      writeFile(configFilePath, configContent, 'utf8'),
      writeFile(examplePath, exampleContent, 'utf8'),
    ]);

    console.log(`\n[+] Files generated in ${BILLING_DIR}/`);
    console.log(`    ${configFilePath}`);
    console.log(`    ${examplePath}`);
    console.log('\nNext steps:');
    console.log('1. Review the generated files');
    console.log(`2. Run: npx tsx ${WIZARD_EXAMPLE_FILE}`);
    console.log('3. Start building your billing integration!');

    // ─── Validation tests ───────────────────────────────────────

    const loading = new LoadingAnimation();
    console.log('\nRunning validation tests...');

    try {
      const { execSync } = await import('child_process');
      const fs = await import('node:fs');
      const path = await import('node:path');

      loading.start('Testing TypeScript compilation');
      execSync('pnpm typecheck', { stdio: 'pipe' });
      loading.stop('[+] TypeScript compilation passed');

      loading.start('Testing build process');
      execSync('pnpm build', { stdio: 'pipe' });
      loading.stop('[+] Build process passed');

      loading.start('Testing billing configuration');
      const cfgPath = path.resolve(process.cwd(), WIZARD_CONFIG_FILE);
      if (!fs.existsSync(cfgPath)) throw new Error(`${WIZARD_CONFIG_FILE} file not found`);
      const cfgContent = fs.readFileSync(cfgPath, 'utf8');
      if (!cfgContent.includes('export const billingConfig')) throw new Error('billing-config.ts does not export billingConfig');
      loading.stop('[+] Billing configuration valid');

      console.log('\n[+] All validation tests passed!');
      console.log('Your billing integration is ready to use.');
    } catch (error) {
      console.log('\n[x] Validation tests failed:');
      console.error('Error:', error instanceof Error ? error.message : error);
      console.log('\nPlease review the generated files and fix any issues.');
      console.log('You can run the following commands to debug:');
      console.log('  pnpm typecheck');
      console.log('  pnpm build');
    }

    // ─── Optional lifecycle tests ───────────────────────────────

    const runTests = answers['run-tests'] as boolean;
    if (runTests) {
      const variantId = selectedProductIds[0];
      if (!variantId) {
        console.log('[-] Skipping lifecycle tests: no product variant selected.');
      } else {
        const testConfig: TestEnvConfig = {
          isSandbox,
          apiKey: answers['api-key'] as string,
          storeId: selectedStoreIds[0] ?? '',
          variantId,
          webhookUrl: state.webhookUrl,
          orderId: envId('LS_TEST_ORDER_ID'),
          subscriptionId: envId('LS_TEST_SUBSCRIPTION_ID'),
          licenseKey: envId('LS_TEST_LICENSE_KEY'),
        };
        await runAllPhases(testConfig, loading);
      }
    }

    console.log('\n[+] Wizard complete!');
  } catch (error) {
    if (error instanceof Error && error.name === 'ExitPromptError') {
      console.log('\n[x] Wizard cancelled');
      process.exit(0);
    }
    console.error('\n[x] Error:', error);
    process.exit(1);
  }
}

runGrimoireWizard();
