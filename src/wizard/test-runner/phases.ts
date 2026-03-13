import { LoadingAnimation } from '../components/loading.js';
import type { TestEnvConfig } from './config.js';
import { runPhaseSetup } from './phase-setup.js';
import { runPhaseCustomer } from './phase-customer.js';
import { runPhaseOrder } from './phase-order.js';
import { runPhaseSubscription } from './phase-subscription.js';
import { runPhaseLicense } from './phase-license.js';
import { runPhaseResolution } from './phase-resolution.js';

declare const process: {
  env: Record<string, string | undefined>;
};

async function safePhase(
  name: string,
  fn: () => Promise<Partial<TestEnvConfig>>
): Promise<Partial<TestEnvConfig>> {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`[x] ${name} failed: ${message}`);
    return {};
  }
}

export async function runAllPhases(
  config: TestEnvConfig,
  loading: LoadingAnimation
): Promise<void> {
  let currentConfig = { ...config };

  const setupResult = await safePhase('Phase 1: Setup', () =>
    runPhaseSetup(currentConfig, loading)
  );
  currentConfig = { ...currentConfig, ...setupResult };

  const customerResult = await safePhase('Phase 2: Customer', () =>
    runPhaseCustomer(currentConfig, loading)
  );
  currentConfig = { ...currentConfig, ...customerResult };

  const envOrderId = process.env['LS_TEST_ORDER_ID'];
  if (envOrderId) {
    currentConfig = { ...currentConfig, orderId: envOrderId };
  }

  const orderResult = await safePhase('Phase 3: Order', () =>
    runPhaseOrder(currentConfig, loading)
  );
  currentConfig = { ...currentConfig, ...orderResult };

  const subResult = await safePhase('Phase 4: Subscription', () =>
    runPhaseSubscription(currentConfig, loading)
  );
  currentConfig = { ...currentConfig, ...subResult };

  const licResult = await safePhase('Phase 5: License', () =>
    runPhaseLicense(currentConfig, loading)
  );
  currentConfig = { ...currentConfig, ...licResult };

  await safePhase('Phase 6: Resolution', () =>
    runPhaseResolution(currentConfig, loading)
  );
}
