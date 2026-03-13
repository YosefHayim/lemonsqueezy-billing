import {
  createCustomer,
  updateCustomer,
  createCheckout,
} from '@lemonsqueezy/lemonsqueezy.js';
import type { TestEnvConfig } from './config.js';
import { LoadingAnimation } from '../components/loading.js';
import { loggedCall } from './logger.js';
import { stepCheckoutOptional } from '../steps/checkout-optional.js';

declare const process: {
  env: Record<string, string | undefined>;
};

export async function runPhaseCustomer(
  config: TestEnvConfig,
  loading: LoadingAnimation
): Promise<Partial<TestEnvConfig>> {
  const updates: Partial<TestEnvConfig> = {};

  let customerId: string | undefined;
  try {
    const customer = await loggedCall(
      '2.1 createCustomer',
      () =>
        createCustomer(config.storeId, {
          name: 'Wizard Test User',
          email: 'wizard-test@example.com',
        }),
      loading
    );
    customerId = customer.data?.data?.id;
    updates.customerId = customerId;
  } catch {
    return updates;
  }

  if (!customerId) {
    return updates;
  }

  try {
    await loggedCall(
      '2.2 updateCustomer',
      () => updateCustomer(customerId, { name: 'Wizard Test User Updated' }),
      loading
    );
  } catch { /* empty */ }

  let checkoutUrl: string | undefined;
  try {
    const checkout = await loggedCall(
      '2.3 createCheckout',
      () =>
        createCheckout(config.storeId, config.variantId ?? '', {
          checkoutData: {
            email: 'wizard-test@example.com',
            custom: { user_id: 'wizard-test-user' },
          },
        }),
      loading
    );
    checkoutUrl = checkout.data?.data?.attributes?.url;
  } catch { /* empty */ }

  if (checkoutUrl) {
    try {
      const completed = await stepCheckoutOptional(checkoutUrl);
      if (completed) {
        const envOrderId = process.env['LS_TEST_ORDER_ID'];
        if (envOrderId) {
          updates.orderId = envOrderId;
        }
      }
    } catch { /* empty */ }
  }

  return updates;
}
