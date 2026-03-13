import {
  getOrder,
  getOrderItem,
} from '@lemonsqueezy/lemonsqueezy.js';
import type { TestEnvConfig } from './config.js';
import { LoadingAnimation } from '../components/loading.js';
import { loggedCall } from './logger.js';

export async function runPhaseOrder(
  config: TestEnvConfig,
  loading: LoadingAnimation
): Promise<Partial<TestEnvConfig>> {
  if (!config.orderId) {
    console.log('Skipped Phase 3: no order ID');
    return {};
  }

  const updates: Partial<TestEnvConfig> = {};

  let orderItemId: string | undefined;
  try {
    const order = await loggedCall(
      '3.1 getOrder',
      () => getOrder(config.orderId!),
      loading
    );
    orderItemId = order.data?.data?.relationships?.['order-items']?.data?.[0]?.id;
  } catch { /* empty */ }

  if (orderItemId) {
    try {
      await loggedCall(
        '3.2 getOrderItem',
        () => getOrderItem(orderItemId),
        loading
      );
      updates.orderItemId = orderItemId;
    } catch { /* empty */ }
  }

  return updates;
}
