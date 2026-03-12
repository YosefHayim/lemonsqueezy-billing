import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  BillingCallbacks,
  WebhookPayload,
  PurchaseEvent,
  RefundEvent,
  SubscriptionEvent,
  PaymentFailedEvent,
  SubscriptionPausedEvent,
  SubscriptionResumedEvent,
  SubscriptionPaymentSuccessEvent,
  SubscriptionPaymentRecoveredEvent,
  LicenseKeyEvent,
} from "./types.js";

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

export function createWebhookHandler(callbacks: BillingCallbacks, dedupTtlMs?: number) {
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

  return async (payload: WebhookPayload): Promise<{ dispatched: string | null; skipped: boolean }> => {
    const eventName = payload.meta.event_name;
    const dataId = payload.data.id;

    if (isDuplicate(eventName, dataId)) {
      return { dispatched: null, skipped: true };
    }

    const attrs = payload.data.attributes;
    const userId = extractUserId(payload);
    const email = extractEmail(attrs);

    switch (eventName) {
      case "order_created": {
        const event: PurchaseEvent = {
          userId,
          email,
          orderId: dataId,
          customerId: String(attrs.customer_id ?? ""),
          variantId: String(attrs.variant_id ?? ""),
          productName: String(attrs.product_name ?? ""),
          price: Number(attrs.total ?? 0),
        };
        await callbacks.onPurchase(event);
        return { dispatched: "onPurchase", skipped: false };
      }

      case "order_refunded": {
        if (callbacks.onRefund) {
          const event: RefundEvent = { userId, email, orderId: dataId };
          await callbacks.onRefund(event);
          return { dispatched: "onRefund", skipped: false };
        }
        return { dispatched: null, skipped: false };
      }

      case "subscription_created": {
        if (callbacks.onSubscriptionCreated) {
          const event = buildSubscriptionEvent(userId, email, dataId, attrs);
          await callbacks.onSubscriptionCreated(event);
          return { dispatched: "onSubscriptionCreated", skipped: false };
        }
        return { dispatched: null, skipped: false };
      }

      case "subscription_updated": {
        if (callbacks.onSubscriptionUpdated) {
          const event = buildSubscriptionEvent(userId, email, dataId, attrs);
          await callbacks.onSubscriptionUpdated(event);
          return { dispatched: "onSubscriptionUpdated", skipped: false };
        }
        return { dispatched: null, skipped: false };
      }

      case "subscription_cancelled": {
        if (callbacks.onSubscriptionCancelled) {
          const event = buildSubscriptionEvent(userId, email, dataId, attrs);
          await callbacks.onSubscriptionCancelled(event);
          return { dispatched: "onSubscriptionCancelled", skipped: false };
        }
        return { dispatched: null, skipped: false };
      }

      case "subscription_expired": {
        if (callbacks.onSubscriptionExpired) {
          const event = buildSubscriptionEvent(userId, email, dataId, attrs);
          await callbacks.onSubscriptionExpired(event);
          return { dispatched: "onSubscriptionExpired", skipped: false };
        }
        return { dispatched: null, skipped: false };
      }

      case "subscription_payment_failed": {
        if (callbacks.onPaymentFailed) {
          const event: PaymentFailedEvent = {
            userId,
            email,
            subscriptionId: dataId,
            customerId: String(attrs.customer_id ?? ""),
            reason: String(attrs.status_formatted ?? "Payment failed"),
          };
          await callbacks.onPaymentFailed(event);
          return { dispatched: "onPaymentFailed", skipped: false };
        }
        return { dispatched: null, skipped: false };
      }

      case "subscription_paused": {
        if (callbacks.onSubscriptionPaused) {
          const event: SubscriptionPausedEvent = {
            userId,
            email,
            subscriptionId: dataId,
            customerId: String(attrs.customer_id ?? ""),
            reason: String(attrs.pause_reason ?? ""),
          };
          await callbacks.onSubscriptionPaused(event);
          return { dispatched: "onSubscriptionPaused", skipped: false };
        }
        return { dispatched: null, skipped: false };
      }

      case "subscription_resumed":
      case "subscription_unpaused": {
        if (callbacks.onSubscriptionResumed) {
          const event: SubscriptionResumedEvent = {
            userId,
            email,
            subscriptionId: dataId,
            customerId: String(attrs.customer_id ?? ""),
          };
          await callbacks.onSubscriptionResumed(event);
          return { dispatched: "onSubscriptionResumed", skipped: false };
        }
        return { dispatched: null, skipped: false };
      }

      case "subscription_payment_success": {
        if (callbacks.onSubscriptionPaymentSuccess) {
          const event: SubscriptionPaymentSuccessEvent = {
            userId,
            email,
            subscriptionId: dataId,
            customerId: String(attrs.customer_id ?? ""),
            orderId: String(attrs.order_id ?? ""),
            amount: Number(attrs.total ?? 0),
          };
          await callbacks.onSubscriptionPaymentSuccess(event);
          return { dispatched: "onSubscriptionPaymentSuccess", skipped: false };
        }
        return { dispatched: null, skipped: false };
      }

      case "subscription_payment_recovered": {
        if (callbacks.onSubscriptionPaymentRecovered) {
          const event: SubscriptionPaymentRecoveredEvent = {
            userId,
            email,
            subscriptionId: dataId,
            customerId: String(attrs.customer_id ?? ""),
            orderId: String(attrs.order_id ?? ""),
            amount: Number(attrs.total ?? 0),
          };
          await callbacks.onSubscriptionPaymentRecovered(event);
          return { dispatched: "onSubscriptionPaymentRecovered", skipped: false };
        }
        return { dispatched: null, skipped: false };
      }

      case "license_key_created": {
        if (callbacks.onLicenseKeyCreated) {
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
          await callbacks.onLicenseKeyCreated(event);
          return { dispatched: "onLicenseKeyCreated", skipped: false };
        }
        return { dispatched: null, skipped: false };
      }

      case "license_key_updated": {
        if (callbacks.onLicenseKeyUpdated) {
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
          await callbacks.onLicenseKeyUpdated(event);
          return { dispatched: "onLicenseKeyUpdated", skipped: false };
        }
        return { dispatched: null, skipped: false };
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
