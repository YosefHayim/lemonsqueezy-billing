import type { LicenseKeyEvent } from '../license/types.js';
import type { 
  SubscriptionEvent, 
  AnySubscriptionEvent,
} from '../subscription/types.js';
import type { WebhookMethod, WebhookPayload } from '../webhook/types.js';

// ─── Order Events ─────────────────────────────────────────────────────────────

export interface OrderEvent {
  userId: string;
  email: string;
  orderId: string;
  customerId?: string;
  variantId?: string;
  productName?: string;
  price?: number;
}

export type OrderMethod = 'purchase' | 'refund';

// ─── Subscription ─────────────────────────────────────────────────────────────

export type SubscriptionMethod =
  | 'created'
  | 'updated'
  | 'cancelled'
  | 'expired'
  | 'paused'
  | 'resumed'
  | 'payment_success'
  | 'payment_recovered'
  | 'payment_failed';

// ─── License ──────────────────────────────────────────────────────────────────

export type LicenseMethod = 'created' | 'updated';

// ─── Webhook union ────────────────────────────────────────────────────────────

export type WebhookEvent =
  | OrderEvent
  | AnySubscriptionEvent
  | LicenseKeyEvent;

// ─── Webhook Meta ─────────────────────────────────────────────────────────────

export interface WebhookMeta {
  isTest: boolean;
  eventId: string;
}

// ─── Callbacks ───────────────────────────────────────────────────────────────

export interface BillingCallbacks {
  onOrder: (event: OrderEvent, method: OrderMethod, meta: WebhookMeta) => Promise<void>;
  onSubscription?: (event: AnySubscriptionEvent, method: SubscriptionMethod, meta: WebhookMeta) => Promise<void>;
  onLicenseKey?: (event: LicenseKeyEvent, method: LicenseMethod, meta: WebhookMeta) => Promise<void>;
  onWebhook?: (eventType: WebhookMethod, event: WebhookEvent, meta: WebhookMeta) => Promise<void>;
}

export interface CheckoutParams {
  variantId: string;
  email: string;
  userId: string;
  redirectUrl?: string;
  discountCode?: string;
  name?: string;
  customPrice?: number;
  enabledVariants?: string[];
  locale?: string;
}

export interface ExpressRouterOptions {
  requireAuth?: (req: unknown, res: unknown, next: () => void) => void;
  getUserId: (req: unknown) => string;
  getUserEmail: (req: unknown) => string;
}
