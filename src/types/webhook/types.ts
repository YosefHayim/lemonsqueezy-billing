export type WebhookMethod =
  | 'order_created'
  | 'order_refunded'
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_cancelled'
  | 'subscription_expired'
  | 'subscription_payment_failed'
  | 'subscription_paused'
  | 'subscription_resumed'
  | 'subscription_unpaused'
  | 'subscription_payment_success'
  | 'subscription_payment_recovered'
  | 'license_key_created'
  | 'license_key_updated';

export interface WebhookPayload {
  meta: {
    event_name: string;
    custom_data?: Record<string, unknown>;
    test_mode: boolean;
  };
  data: {
    id: string;
    type: string;
    attributes: Record<string, unknown>;
  };
}
