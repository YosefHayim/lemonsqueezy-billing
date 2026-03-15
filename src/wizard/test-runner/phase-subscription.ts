import {
  getSubscription,
  updateSubscription,
  createUsageRecord,
  listSubscriptions,
  getSubscriptionItem,
  listSubscriptionItems,
  getSubscriptionItemCurrentUsage,
  listUsageRecords,
  listSubscriptionInvoices,
  getSubscriptionInvoice,
} from '@lemonsqueezy/lemonsqueezy.js';
import type { TestEnvConfig } from './config.js';
import { LoadingAnimation } from '../components/loading.js';
import { loggedCall } from './logger.js';

export async function runPhaseSubscription(
  config: TestEnvConfig,
  loading: LoadingAnimation
): Promise<Partial<TestEnvConfig>> {
  if (!config.subscriptionId) {
    console.log('Skipped Phase 4: no subscription ID');
    return {};
  }

  let subscriptionItemId: string | undefined;
  try {
    const subscription = await loggedCall(
      '4.1 getSubscription',
      () => getSubscription(config.subscriptionId!),
      loading
    );
    subscriptionItemId =
      subscription.data?.data?.relationships?.['subscription-items']?.data?.[0]?.id;
  } catch { /* empty */ }

  try {
    await loggedCall(
      '4.2 updateSubscription (unpause)',
      () => updateSubscription(config.subscriptionId!, { pause: null }),
      loading
    );
  } catch { /* empty */ }

  if (subscriptionItemId) {
    try {
      await loggedCall(
        '4.3 createUsageRecord',
        () =>
          createUsageRecord({
            subscriptionItemId,
            quantity: 1,
            action: 'increment',
          }),
        loading
      );
    } catch { /* empty */ }
  }

  try {
    await loggedCall(
      '4.4 listSubscriptions',
      () => listSubscriptions({ filter: { storeId: config.storeId } }),
      loading
    );
  } catch { /* empty */ }

  if (subscriptionItemId) {
    try {
      await loggedCall(
        '4.5 getSubscriptionItem',
        () => getSubscriptionItem(subscriptionItemId),
        loading
      );
    } catch { /* empty */ }
  }

  try {
    await loggedCall(
      '4.6 listSubscriptionItems',
      () => listSubscriptionItems({ filter: { subscriptionId: config.subscriptionId! } }),
      loading
    );
  } catch { /* empty */ }

  if (subscriptionItemId) {
    try {
      await loggedCall(
        '4.7 getSubscriptionItemCurrentUsage',
        () => getSubscriptionItemCurrentUsage(subscriptionItemId),
        loading
      );
    } catch { /* empty */ }

    try {
      await loggedCall(
        '4.8 listUsageRecords',
        () => listUsageRecords({ filter: { subscriptionItemId } }),
        loading
      );
    } catch { /* empty */ }
  }

  let firstInvoiceId: string | undefined;
  try {
    const invoices = await loggedCall(
      '4.9 listSubscriptionInvoices',
      () => listSubscriptionInvoices({ filter: { subscriptionId: config.subscriptionId! } }),
      loading
    );
    firstInvoiceId = invoices.data?.data?.[0]?.id;
  } catch { /* empty */ }

  if (firstInvoiceId) {
    try {
      await loggedCall(
        '4.10 getSubscriptionInvoice',
        () => getSubscriptionInvoice(firstInvoiceId),
        loading
      );
    } catch { /* empty */ }
  }

  return {};
}
