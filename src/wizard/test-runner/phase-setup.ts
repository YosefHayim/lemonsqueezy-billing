import {
  getAuthenticatedUser,
  getStore,
  listProducts,
  listVariants,
  listPrices,
  createWebhook,
  createDiscount,
  lemonSqueezySetup,
  listStores,
  listWebhooks,
  listDiscounts,
  getWebhook,
  listCheckouts,
} from '@lemonsqueezy/lemonsqueezy.js';
import type { TestEnvConfig } from './config.js';
import { LoadingAnimation } from '../components/loading.js';
import { loggedCall } from './logger.js';

export async function runPhaseSetup(
  config: TestEnvConfig,
  loading: LoadingAnimation
): Promise<Partial<TestEnvConfig>> {
  lemonSqueezySetup({ apiKey: config.apiKey });

  const updates: Partial<TestEnvConfig> = {};

  try {
    await loggedCall('1.1 getAuthenticatedUser', () => getAuthenticatedUser(), loading);
  } catch { /* empty */ }

  try {
    await loggedCall('1.2 getStore', () => getStore(config.storeId), loading);
  } catch { /* empty */ }

  let firstProductId: string | undefined;
  try {
    const products = await loggedCall(
      '1.3 listProducts',
      () => listProducts({ filter: { storeId: config.storeId } }),
      loading
    );
    firstProductId = products.data?.data?.[0]?.id;
  } catch { /* empty */ }

  let firstVariantId: string | undefined;
  if (firstProductId) {
    try {
      const variants = await loggedCall(
        '1.4 listVariants',
        () => listVariants({ filter: { productId: firstProductId } }),
        loading
      );
      firstVariantId = variants.data?.data?.[0]?.id;
    } catch { /* empty */ }
  }

  if (firstVariantId) {
    try {
      await loggedCall(
        '1.5 listPrices',
        () => listPrices({ filter: { variantId: firstVariantId } }),
        loading
      );
    } catch { /* empty */ }
  }

  if (config.webhookUrl) {
    try {
      const webhook = await loggedCall(
        '1.6 createWebhook',
        () =>
          createWebhook(config.storeId, {
            url: config.webhookUrl!,
            events: ['order_created', 'subscription_created'],
            secret: 'test-webhook-secret-123',
          }),
        loading
      );
      updates.webhookId = webhook.data?.data?.id;
    } catch { /* empty */ }
  }

  if (updates.webhookId) {
    try {
      await loggedCall(
        '1.6b getWebhook',
        () => getWebhook(updates.webhookId!),
        loading
      );
    } catch { /* empty */ }
  }

  try {
    await loggedCall(
      '1.6c listCheckouts',
      () => listCheckouts({ filter: { storeId: config.storeId } }),
      loading
    );
  } catch { /* empty */ }

  try {
    const discount = await loggedCall(
      '1.7 createDiscount',
      () =>
        createDiscount({
          storeId: config.storeId,
          name: 'Test Discount',
          code: 'WIZARDTEST',
          amount: 10,
          amountType: 'percent',
        }),
      loading
    );
    updates.discountId = discount.data?.data?.id;
  } catch { /* empty */ }

  try {
    await loggedCall('1.8 listStores', () => listStores(), loading);
  } catch { /* empty */ }

  try {
    await loggedCall(
      '1.9 listWebhooks',
      () => listWebhooks({ filter: { storeId: config.storeId } }),
      loading
    );
  } catch { /* empty */ }

  try {
    await loggedCall(
      '1.10 listDiscounts',
      () => listDiscounts({ filter: { storeId: config.storeId } }),
      loading
    );
  } catch { /* empty */ }

  return updates;
}
