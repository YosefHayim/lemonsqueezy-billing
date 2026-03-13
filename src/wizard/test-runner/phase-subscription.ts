import {
  getSubscription,
  updateSubscription,
  createUsageRecord,
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

  return {};
}
