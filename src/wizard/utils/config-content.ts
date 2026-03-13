import type { WizardState } from '../state.js';

export function generateConfigContent(state: WizardState): string {
  const lines: string[] = [];

  lines.push(
    'import type { BillingConfig, PurchaseEvent, RefundEvent, AnySubscriptionEvent, SubscriptionMethod, SubscriptionPaymentSuccessEvent, SubscriptionPaymentRecoveredEvent, SubscriptionPaymentMethod, PaymentFailedEvent, LicenseKeyEvent, LicenseMethod } from "./types";'
  );
  lines.push('');
  lines.push('export const billingConfig: BillingConfig = {');
  lines.push(`  apiKey: process.env.LEMON_SQUEEZY_API_KEY || "${state.apiKey}",`);
  lines.push(`  storeId: "${state.selectedStoreIds[0]}",`);
  lines.push(`  webhookSecret: "${state.webhookSecret}",`);
  lines.push(`  cachePath: "${state.cachePath}",`);
  lines.push(`  logger: { filePath: "${state.loggerPath}" },`);
  lines.push('  callbacks: {');
  lines.push('    onPurchase: async (event: PurchaseEvent) => {');
  lines.push('      console.log("Purchase:", event);');
  lines.push('    },');
  lines.push('    onRefund: async (event: RefundEvent) => {');
  lines.push('      console.log("Refund:", event);');
  lines.push('    },');
  lines.push(
    '    onSubscription: async (event: AnySubscriptionEvent, method: SubscriptionMethod) => {'
  );
  lines.push('      console.log("Subscription", method, event);');
  lines.push('    },');
  lines.push(
    '    onSubscriptionPayment: async (event: SubscriptionPaymentSuccessEvent | SubscriptionPaymentRecoveredEvent, method: SubscriptionPaymentMethod) => {'
  );
  lines.push('      console.log("Payment", method, event);');
  lines.push('    },');
  lines.push('    onPaymentFailed: async (event: PaymentFailedEvent) => {');
  lines.push('      console.log("Payment failed:", event);');
  lines.push('    },');
  lines.push('    onLicenseKey: async (method: LicenseMethod, event: LicenseKeyEvent) => {');
  lines.push('      console.log("License key", method, event);');
  lines.push('    },');
  lines.push('  },');
  lines.push('};');

  if (state.webhookUrl) {
    lines.push('');
    lines.push('export const webhookConfig = {');
    lines.push(`  url: "${state.webhookUrl}",`);
    const eventsStr = state.webhookEvents.map((e) => `"${e}"`).join(', ');
    lines.push(`  events: [${eventsStr}],`);
    lines.push(
      `  secret: "${state.webhookSecret.slice(0, 8)}...${state.webhookSecret.slice(-4)}",`
    );
    lines.push('};');
  }

  return lines.join('\n');
}
