import type { WizardState } from '../state.js';

export function generateConfigContent(state: WizardState): string {
  const lines: string[] = [];

  lines.push(
    'import type { BillingConfig, OrderEvent, OrderMethod, AnySubscriptionEvent, SubscriptionMethod, LicenseKeyEvent, LicenseMethod, WebhookMeta } from "fresh-squeezy";'
  );
  lines.push('');
  lines.push('export const billingConfig: BillingConfig = {');
  const envKey = state.isSandbox ? 'LS_TEST_API_KEY' : 'LS_LIVE_API_KEY';
  lines.push(`  apiKey: process.env.${envKey} || ${JSON.stringify(state.apiKey)},`);
  lines.push(`  storeId: ${JSON.stringify(state.selectedStoreIds[0])},`);
  lines.push(`  webhookSecret: ${JSON.stringify(state.webhookSecret)},`);
  lines.push(`  cachePath: ${JSON.stringify(state.cachePath)},`);
  lines.push(`  logger: { filePath: ${JSON.stringify(state.loggerPath)} },`);
  lines.push(`  skipTestEvents: ${state.isSandbox ? 'false' : 'true'},`);
  lines.push('  callbacks: {');
  lines.push('    onOrder: async (event: OrderEvent, method: OrderMethod, meta: WebhookMeta) => {');
  lines.push('      if (meta.isTest) return;');
  lines.push('      // event.userId  — your internal user ID (passed at checkout)');
  lines.push('      // event.email   — customer email');
  lines.push('      // event.orderId — Lemon Squeezy order ID');
  lines.push('      // event.price   — amount in cents');
  lines.push('      if (method === "purchase") {');
  lines.push('        // TODO: grant access — e.g. await prisma.user.update({ where: { id: event.userId }, data: { isPro: true } })');
  lines.push('        console.log("[+] Purchase:", event.orderId, event.email);');
  lines.push('      }');
  lines.push('      if (method === "refund") {');
  lines.push('        // TODO: revoke access — e.g. await prisma.user.update({ where: { id: event.userId }, data: { isPro: false } })');
  lines.push('        console.log("[-] Refund:", event.orderId);');
  lines.push('      }');
  lines.push('    },');
  lines.push('    onSubscription: async (event: AnySubscriptionEvent, method: SubscriptionMethod, meta: WebhookMeta) => {');
  lines.push('      if (meta.isTest) return;');
  lines.push('      // event.userId         — your internal user ID');
  lines.push('      // event.subscriptionId — Lemon Squeezy subscription ID');
  lines.push('      // event.status         — active | cancelled | expired | paused');
  lines.push('      // method values: created | updated | cancelled | expired | paused | resumed');
  lines.push('      //                payment_success | payment_recovered | payment_failed');
  lines.push('      if (method === "created")         { /* TODO: activate subscription */ }');
  lines.push('      if (method === "cancelled")       { /* TODO: mark subscription cancelled */ }');
  lines.push('      if (method === "payment_success") { /* TODO: extend access, clear dunning flags */ }');
  lines.push('      if (method === "payment_failed")  { /* TODO: notify customer, start dunning */ }');
  lines.push('      console.log("[~] Subscription", method, event.userId);');
  lines.push('    },');
  lines.push('    onLicenseKey: async (event: LicenseKeyEvent, method: LicenseMethod, meta: WebhookMeta) => {');
  lines.push('      if (meta.isTest) return;');
  lines.push('      // event.userId — your internal user ID');
  lines.push('      // event.key    — the license key string to store and share with the user');
  lines.push('      // event.status — active | inactive | expired');
  lines.push('      if (method === "created") { /* TODO: store event.key in your DB */ }');
  lines.push('      console.log("[K] License key", method, event.userId);');
  lines.push('    },');
  lines.push('  },');
  lines.push('};');

  if (state.webhookUrl) {
    lines.push('');
    lines.push('export const webhookConfig = {');
    lines.push(`  url: ${JSON.stringify(state.webhookUrl)},`);
    const eventsStr = state.webhookEvents.map((e) => `"${e}"`).join(', ');
    lines.push(`  events: [${eventsStr}],`);
    lines.push(
      `  secret: ${JSON.stringify(state.webhookSecret.slice(0, 8) + '...' + state.webhookSecret.slice(-4))},`
    );
    lines.push('};');
  }

  return lines.join('\n');
}
