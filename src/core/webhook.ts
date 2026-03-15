import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  BillingCallbacks,
  WebhookPayload,
  WebhookMeta,
  OrderEvent,
  OrderMethod,
  SubscriptionEvent,
  SubscriptionPaymentSuccessEvent,
  SubscriptionPaymentRecoveredEvent,
  PaymentFailedEvent,
  SubscriptionPausedEvent,
  SubscriptionResumedEvent,
  SubscriptionMethod,
  LicenseKeyEvent,
  LicenseMethod,
  WebhookMethod,
  WebhookEvent,
} from "../types/index.js";

const DEFAULT_DEDUP_TTL_MS = 3_600_000;

export function createWebhookVerifier(secret: string) {
  return (rawBody: string, signature: string): boolean => {
    const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
    try {
      return timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
    } catch {
      return false;
    }
  };
}

export function createWebhookHandler(callbacks: BillingCallbacks, dedupTtlMs?: number, options?: { skipTestEvents?: boolean }) {
  const seen = new Map<string, number>();
  const ttl = dedupTtlMs ?? DEFAULT_DEDUP_TTL_MS;

  function cleanup() {
    const now = Date.now();
    for (const [key, timestamp] of seen) {
      if (now - timestamp > ttl) seen.delete(key);
    }
  }

  function isDuplicate(eventName: string, dataId: string): boolean {
    cleanup();
    const key = `${eventName}-${dataId}`;
    if (seen.has(key)) return true;
    seen.set(key, Date.now());
    return false;
  }

  async function dispatchWebhook(eventType: WebhookMethod, event: WebhookEvent, meta: WebhookMeta): Promise<void> {
    if (callbacks.onWebhook) {
      await callbacks.onWebhook(eventType, event, meta);
    }
  }

  return async (payload: WebhookPayload): Promise<{ dispatched: string | null; skipped: boolean }> => {
    const eventName = payload.meta.event_name as WebhookMethod;
    const dataId = payload.data.id;

    const meta: WebhookMeta = {
      isTest: payload.meta.test_mode === true,
      eventId: `${eventName}-${dataId}`,
    };

    if (options?.skipTestEvents && meta.isTest) {
      return { dispatched: null, skipped: true };
    }

    if (isDuplicate(eventName, dataId)) {
      return { dispatched: null, skipped: true };
    }

    const attrs = payload.data.attributes;
    const userId = extractUserId(payload);
    const email = extractEmail(attrs);

    switch (eventName) {
       case "order_created": {
         const event: OrderEvent = {
           userId,
           email,
           orderId: dataId,
           customerId: String(attrs.customer_id ?? ""),
           variantId: String(attrs.variant_id ?? ""),
           productName: String(attrs.product_name ?? ""),
           price: Number(attrs.total ?? 0),
         };
         await callbacks.onOrder(event, "purchase", meta);
         await dispatchWebhook(eventName, event, meta);
         return { dispatched: "onOrder:purchase", skipped: false };
       }

       case "order_refunded": {
         const event: OrderEvent = { userId, email, orderId: dataId };
         await callbacks.onOrder(event, "refund", meta);
         await dispatchWebhook(eventName, event, meta);
         return { dispatched: "onOrder:refund", skipped: false };
       }

       case "subscription_created":
       case "subscription_updated":
       case "subscription_cancelled":
       case "subscription_expired": {
         const method = eventName.replace("subscription_", "") as SubscriptionMethod;
         const event = buildSubscriptionEvent(userId, email, dataId, attrs);
         if (callbacks.onSubscription) {
           await callbacks.onSubscription(event, method, meta);
         }
         await dispatchWebhook(eventName, event, meta);
         return { dispatched: callbacks.onSubscription ? `onSubscription:${method}` : null, skipped: false };
       }

       case "subscription_paused": {
         const event: SubscriptionPausedEvent = {
           userId,
           email,
           subscriptionId: dataId,
           customerId: String(attrs.customer_id ?? ""),
           reason: String(attrs.pause_reason ?? ""),
         };
         if (callbacks.onSubscription) {
           await callbacks.onSubscription(event, "paused", meta);
         }
         await dispatchWebhook(eventName, event, meta);
         return { dispatched: callbacks.onSubscription ? "onSubscription:paused" : null, skipped: false };
       }

       case "subscription_resumed":
       case "subscription_unpaused": {
         const event: SubscriptionResumedEvent = {
           userId,
           email,
           subscriptionId: dataId,
           customerId: String(attrs.customer_id ?? ""),
         };
         if (callbacks.onSubscription) {
           await callbacks.onSubscription(event, "resumed", meta);
         }
         await dispatchWebhook(eventName, event, meta);
         return { dispatched: callbacks.onSubscription ? "onSubscription:resumed" : null, skipped: false };
       }

       case "subscription_payment_success": {
         const event: SubscriptionPaymentSuccessEvent = {
           userId,
           email,
           subscriptionId: dataId,
           customerId: String(attrs.customer_id ?? ""),
           variantId: String(attrs.variant_id ?? ""),
           status: String(attrs.status ?? ""),
           orderId: String(attrs.order_id ?? ""),
           amount: Number(attrs.total ?? 0),
         };
         if (callbacks.onSubscription) {
           await callbacks.onSubscription(event, "payment_success", meta);
         }
         await dispatchWebhook(eventName, event, meta);
         return { dispatched: callbacks.onSubscription ? "onSubscription:payment_success" : null, skipped: false };
       }

       case "subscription_payment_recovered": {
         const event: SubscriptionPaymentRecoveredEvent = {
           userId,
           email,
           subscriptionId: dataId,
           customerId: String(attrs.customer_id ?? ""),
           variantId: String(attrs.variant_id ?? ""),
           status: String(attrs.status ?? ""),
           orderId: String(attrs.order_id ?? ""),
           amount: Number(attrs.total ?? 0),
         };
         if (callbacks.onSubscription) {
           await callbacks.onSubscription(event, "payment_recovered", meta);
         }
         await dispatchWebhook(eventName, event, meta);
         return { dispatched: callbacks.onSubscription ? "onSubscription:payment_recovered" : null, skipped: false };
       }

       case "subscription_payment_failed": {
         const event: PaymentFailedEvent = {
           userId,
           email,
           subscriptionId: dataId,
           customerId: String(attrs.customer_id ?? ""),
           variantId: String(attrs.variant_id ?? ""),
           status: String(attrs.status ?? ""),
           reason: String(attrs.status_formatted ?? "Payment failed"),
         };
         if (callbacks.onSubscription) {
           await callbacks.onSubscription(event, "payment_failed", meta);
         }
         await dispatchWebhook(eventName, event, meta);
         return { dispatched: callbacks.onSubscription ? "onSubscription:payment_failed" : null, skipped: false };
       }

       case "license_key_created": {
         const event: LicenseKeyEvent = {
           userId,
           email,
           licenseKeyId: dataId,
           key: String(attrs.key ?? ""),
           productId: String(attrs.product_id ?? ""),
           variantId: String(attrs.variant_id ?? ""),
           status: String(attrs.status ?? ""),
           activationCount: Number(attrs.activations_count ?? 0),
           maxActivations: Number(attrs.activations_max ?? 0),
         };
         if (callbacks.onLicenseKey) {
           await callbacks.onLicenseKey(event, "created", meta);
         }
         await dispatchWebhook(eventName, event, meta);
         return { dispatched: callbacks.onLicenseKey ? "onLicenseKey:created" : null, skipped: false };
       }

       case "license_key_updated": {
         const event: LicenseKeyEvent = {
           userId,
           email,
           licenseKeyId: dataId,
           key: String(attrs.key ?? ""),
           productId: String(attrs.product_id ?? ""),
           variantId: String(attrs.variant_id ?? ""),
           status: String(attrs.status ?? ""),
           activationCount: Number(attrs.activations_count ?? 0),
           maxActivations: Number(attrs.activations_max ?? 0),
         };
         if (callbacks.onLicenseKey) {
           await callbacks.onLicenseKey(event, "updated", meta);
         }
         await dispatchWebhook(eventName, event, meta);
         return { dispatched: callbacks.onLicenseKey ? "onLicenseKey:updated" : null, skipped: false };
       }

      default:
        return { dispatched: null, skipped: false };
    }
  };
}

function extractUserId(payload: WebhookPayload): string {
  const customData = payload.meta.custom_data;
  if (customData && typeof customData.user_id === "string") return customData.user_id;
  return String(payload.data.attributes.user_email ?? "");
}

function extractEmail(attrs: Record<string, unknown>): string {
  return String(attrs.user_email ?? "");
}

function buildSubscriptionEvent(
  userId: string,
  email: string,
  dataId: string,
  attrs: Record<string, unknown>
): SubscriptionEvent {
  return {
    userId,
    email,
    subscriptionId: dataId,
    customerId: String(attrs.customer_id ?? ""),
    variantId: String(attrs.variant_id ?? ""),
    status: String(attrs.status ?? ""),
  };
}
