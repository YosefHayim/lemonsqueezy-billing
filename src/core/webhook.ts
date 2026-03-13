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

  async function dispatchWebhook(eventType: WebhookMethod, event: WebhookEvent): Promise<void> {
    if (callbacks.onWebhook) {
      await callbacks.onWebhook(eventType, event);
    }
  }

  return async (payload: WebhookPayload): Promise<{ dispatched: string | null; skipped: boolean }> => {
    const eventName = payload.meta.event_name as WebhookMethod;
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
        await dispatchWebhook(eventName, event);
        return { dispatched: "onPurchase", skipped: false };
      }

      case "order_refunded": {
        const event: RefundEvent = { userId, email, orderId: dataId };
        if (callbacks.onRefund) {
          await callbacks.onRefund(event);
        }
        await dispatchWebhook(eventName, event);
        return { dispatched: callbacks.onRefund ? "onRefund" : null, skipped: false };
      }

      case "subscription_created": {
        const event = buildSubscriptionEvent(userId, email, dataId, attrs);
        if (callbacks.onSubscriptionCreated) {
          await callbacks.onSubscriptionCreated(event);
        }
        await dispatchWebhook(eventName, event);
        return { dispatched: callbacks.onSubscriptionCreated ? "onSubscriptionCreated" : null, skipped: false };
      }

      case "subscription_updated": {
        const event = buildSubscriptionEvent(userId, email, dataId, attrs);
        if (callbacks.onSubscriptionUpdated) {
          await callbacks.onSubscriptionUpdated(event);
        }
        await dispatchWebhook(eventName, event);
        return { dispatched: callbacks.onSubscriptionUpdated ? "onSubscriptionUpdated" : null, skipped: false };
      }

      case "subscription_cancelled": {
        const event = buildSubscriptionEvent(userId, email, dataId, attrs);
        if (callbacks.onSubscriptionCancelled) {
          await callbacks.onSubscriptionCancelled(event);
        }
        await dispatchWebhook(eventName, event);
        return { dispatched: callbacks.onSubscriptionCancelled ? "onSubscriptionCancelled" : null, skipped: false };
      }

      case "subscription_expired": {
        const event = buildSubscriptionEvent(userId, email, dataId, attrs);
        if (callbacks.onSubscriptionExpired) {
          await callbacks.onSubscriptionExpired(event);
        }
        await dispatchWebhook(eventName, event);
        return { dispatched: callbacks.onSubscriptionExpired ? "onSubscriptionExpired" : null, skipped: false };
      }

      case "subscription_payment_failed": {
        const event: PaymentFailedEvent = {
          userId,
          email,
          subscriptionId: dataId,
          customerId: String(attrs.customer_id ?? ""),
          reason: String(attrs.status_formatted ?? "Payment failed"),
        };
        if (callbacks.onPaymentFailed) {
          await callbacks.onPaymentFailed(event);
        }
        await dispatchWebhook(eventName, event);
        return { dispatched: callbacks.onPaymentFailed ? "onPaymentFailed" : null, skipped: false };
      }

      case "subscription_paused": {
        const event: SubscriptionPausedEvent = {
          userId,
          email,
          subscriptionId: dataId,
          customerId: String(attrs.customer_id ?? ""),
          reason: String(attrs.pause_reason ?? ""),
        };
        if (callbacks.onSubscriptionPaused) {
          await callbacks.onSubscriptionPaused(event);
        }
        await dispatchWebhook(eventName, event);
        return { dispatched: callbacks.onSubscriptionPaused ? "onSubscriptionPaused" : null, skipped: false };
      }

      case "subscription_resumed":
      case "subscription_unpaused": {
        const event: SubscriptionResumedEvent = {
          userId,
          email,
          subscriptionId: dataId,
          customerId: String(attrs.customer_id ?? ""),
        };
        if (callbacks.onSubscriptionResumed) {
          await callbacks.onSubscriptionResumed(event);
        }
        await dispatchWebhook(eventName, event);
        return { dispatched: callbacks.onSubscriptionResumed ? "onSubscriptionResumed" : null, skipped: false };
      }

      case "subscription_payment_success": {
        const event: SubscriptionPaymentSuccessEvent = {
          userId,
          email,
          subscriptionId: dataId,
          customerId: String(attrs.customer_id ?? ""),
          orderId: String(attrs.order_id ?? ""),
          amount: Number(attrs.total ?? 0),
        };
        if (callbacks.onSubscriptionPaymentSuccess) {
          await callbacks.onSubscriptionPaymentSuccess(event);
        }
        await dispatchWebhook(eventName, event);
        return { dispatched: callbacks.onSubscriptionPaymentSuccess ? "onSubscriptionPaymentSuccess" : null, skipped: false };
      }

      case "subscription_payment_recovered": {
        const event: SubscriptionPaymentRecoveredEvent = {
          userId,
          email,
          subscriptionId: dataId,
          customerId: String(attrs.customer_id ?? ""),
          orderId: String(attrs.order_id ?? ""),
          amount: Number(attrs.total ?? 0),
        };
        if (callbacks.onSubscriptionPaymentRecovered) {
          await callbacks.onSubscriptionPaymentRecovered(event);
        }
        await dispatchWebhook(eventName, event);
        return { dispatched: callbacks.onSubscriptionPaymentRecovered ? "onSubscriptionPaymentRecovered" : null, skipped: false };
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
          await callbacks.onLicenseKey("created", event);
        }
        await dispatchWebhook(eventName, event);
        return { dispatched: callbacks.onLicenseKey ? "onLicenseKey" : null, skipped: false };
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
          await callbacks.onLicenseKey("updated", event);
        }
        await dispatchWebhook(eventName, event);
        return { dispatched: callbacks.onLicenseKey ? "onLicenseKey" : null, skipped: false };
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
