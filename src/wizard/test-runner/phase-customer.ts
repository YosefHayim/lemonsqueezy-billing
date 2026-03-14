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

  if (!config.variantId) {
    console.log('[-] Skipping 2.3 createCheckout: no variantId in config');
  } else {
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
          const { input } = await import('@inquirer/prompts');
          const enteredOrderId = await input({
            message: 'Enter the Order ID (numeric, from LS Dashboard → Orders, e.g. 1234567). Leave blank to skip:',
            default: '',
            validate: (v) => {
              const t = v.trim();
              if (!t) return true;
              return /^\d+$/.test(t) || 'Order ID must be digits only (find it in your LS dashboard under Orders)';
            },
          });
          const trimmedOrderId = enteredOrderId.trim();
          if (trimmedOrderId) {
            updates.orderId = trimmedOrderId;
          }
        }
      } catch { /* empty */ }
    }
  }

  return updates;
}
