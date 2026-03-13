import {
  cancelSubscription,
  deleteWebhook,
  deleteDiscount,
} from '@lemonsqueezy/lemonsqueezy.js';
import type { TestEnvConfig } from './config.js';
import { LoadingAnimation } from '../components/loading.js';
import { loggedCall } from './logger.js';

export async function runPhaseResolution(
  config: TestEnvConfig,
  loading: LoadingAnimation
): Promise<Partial<TestEnvConfig>> {
  if (config.subscriptionId) {
    try {
      await loggedCall(
        '6.1 cancelSubscription',
        () => cancelSubscription(config.subscriptionId!),
        loading
      );
    } catch { /* empty */ }
  }

  if (config.webhookId) {
    try {
      await loggedCall(
        '6.2 deleteWebhook',
        () => deleteWebhook(config.webhookId!),
        loading
      );
    } catch { /* empty */ }
  }

  if (config.discountId) {
    try {
      await loggedCall(
        '6.3 deleteDiscount',
        () => deleteDiscount(config.discountId!),
        loading
      );
    } catch { /* empty */ }
  }

  return {};
}
