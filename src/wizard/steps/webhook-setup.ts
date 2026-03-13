import { input, checkbox, confirm } from '@inquirer/prompts';

declare const process: {
  exit: (code?: number) => void;
};

function isExitPromptError(error: unknown): boolean {
  return error instanceof Error && error.name === 'ExitPromptError';
}

const WEBHOOK_EVENTS = [
  { name: 'Order Created', value: 'order_created' },
  { name: 'Order Refunded', value: 'order_refunded' },
  { name: 'Subscription Created', value: 'subscription_created' },
  { name: 'Subscription Updated', value: 'subscription_updated' },
  { name: 'Subscription Cancelled', value: 'subscription_cancelled' },
  { name: 'Subscription Payment Success', value: 'subscription_payment_success' },
  { name: 'Subscription Payment Recovered', value: 'subscription_payment_recovered' },
  { name: 'Payment Failed', value: 'subscription_payment_failed' },
  { name: 'License Key Created', value: 'license_key_created' },
  { name: 'License Key Updated', value: 'license_key_updated' },
];

export async function stepWebhookSetup(): Promise<{
  webhookUrl?: string;
  webhookEvents: string[];
}> {
  try {
    const shouldCreate = await confirm({
      message: 'Create webhook endpoint?',
      default: true,
    });

    if (!shouldCreate) {
      console.log('[-] Skipping webhook setup');
      return { webhookEvents: [] };
    }

    const webhookUrl = await input({
      message: 'Webhook URL:',
      default: 'https://your-domain.com/webhook',
      validate: (value) => {
        const trimmed = value.trim();
        if (!trimmed) return 'Webhook URL is required';
        if (trimmed.includes('"') || trimmed.includes('\n') || trimmed.includes('\r')) {
          return 'URL cannot contain quotes or newlines';
        }
        try { new URL(trimmed); return true; } catch { return 'Enter a valid URL (e.g. https://example.com/webhook)'; }
      },
    });

    while (true) {
      const webhookEvents = await checkbox({
        message: 'Select webhook events:',
        choices: WEBHOOK_EVENTS.map((event, i) => ({
          name: event.name,
          value: event.value,
          checked: i === 0,
        })),
      });

      if (webhookEvents.length === 0) {
        console.log('[x] Please select at least one event');
        continue;
      }

      console.log('[+] Webhook configuration saved');
      return { webhookUrl, webhookEvents };
    }
  } catch (error) {
    if (isExitPromptError(error)) {
      process.exit(0);
    }
    throw error;
  }
}
