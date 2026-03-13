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
    });

    const webhookEvents = await checkbox({
      message: 'Select webhook events:',
      choices: WEBHOOK_EVENTS.map((event, i) => ({
        name: event.name,
        value: event.value,
        checked: i === 0,
      })),
    });

    console.log('[+] Webhook configuration saved');
    return { webhookUrl, webhookEvents };
  } catch (error) {
    if (isExitPromptError(error)) {
      process.exit(0);
    }
    throw error;
  }
}
