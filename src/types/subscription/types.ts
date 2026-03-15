export interface SubscriptionEvent {
  userId: string;
  email: string;
  subscriptionId: string;
  customerId: string;
  variantId: string;
  status: string;
}

export interface PaymentFailedEvent {
  userId: string;
  email: string;
  subscriptionId: string;
  customerId: string;
  variantId: string;
  status: string;
  reason: string;
}

export interface SubscriptionPausedEvent {
  userId: string;
  email: string;
  subscriptionId: string;
  customerId: string;
  reason?: string;
}

export interface SubscriptionResumedEvent {
  userId: string;
  email: string;
  subscriptionId: string;
  customerId: string;
}

export interface SubscriptionPaymentSuccessEvent {
  userId: string;
  email: string;
  subscriptionId: string;
  customerId: string;
  variantId: string;
  status: string;
  orderId: string;
  amount: number;
}

export interface SubscriptionPaymentRecoveredEvent {
  userId: string;
  email: string;
  subscriptionId: string;
  customerId: string;
  variantId: string;
  status: string;
  orderId: string;
  amount: number;
}

export type AnySubscriptionEvent =
  | SubscriptionEvent
  | SubscriptionPausedEvent
  | SubscriptionResumedEvent
  | SubscriptionPaymentSuccessEvent
  | SubscriptionPaymentRecoveredEvent
  | PaymentFailedEvent;
