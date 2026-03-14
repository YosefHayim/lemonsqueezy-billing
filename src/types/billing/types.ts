import type { LicenseKeyEvent, LicenseMethod } from '../license/types.js';
import type { 
  SubscriptionEvent, 
  PaymentFailedEvent,
  SubscriptionPausedEvent,
  SubscriptionResumedEvent,
  SubscriptionPaymentSuccessEvent,
  SubscriptionPaymentRecoveredEvent,
  SubscriptionMethod,
  SubscriptionPaymentMethod,
  AnySubscriptionEvent,
} from '../subscription/types.js';
import type { WebhookMethod, WebhookPayload } from '../webhook/types.js';

export interface PurchaseEvent {
  userId: string;
  email: string;
  orderId: string;
  customerId: string;
  variantId: string;
  productName: string;
  price: number;
}

export interface RefundEvent {
  userId: string;
  email: string;
  orderId: string;
}

export type WebhookEvent =
  | PurchaseEvent
  | RefundEvent
  | SubscriptionEvent
  | PaymentFailedEvent
  | SubscriptionPausedEvent
  | SubscriptionResumedEvent
  | SubscriptionPaymentSuccessEvent
  | SubscriptionPaymentRecoveredEvent
  | LicenseKeyEvent;

export interface BillingCallbacks {
  onPurchase: (event: PurchaseEvent) => Promise<void>;
  onRefund?: (event: RefundEvent) => Promise<void>;
  onSubscription?: (event: AnySubscriptionEvent, method: SubscriptionMethod) => Promise<void>;
  onSubscriptionPayment?: (event: SubscriptionPaymentSuccessEvent | SubscriptionPaymentRecoveredEvent, method: SubscriptionPaymentMethod) => Promise<void>;
  onPaymentFailed?: (event: PaymentFailedEvent) => Promise<void>;
  onLicenseKey?: (method: LicenseMethod, event: LicenseKeyEvent) => Promise<void>;
  onWebhook?: (eventType: WebhookMethod, event: WebhookEvent) => Promise<void>;
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
