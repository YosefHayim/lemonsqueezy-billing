import { updateSubscription, cancelSubscription } from "@lemonsqueezy/lemonsqueezy.js";
import type { SubscriptionManagement } from "./types.js";
import { withRetry } from "./retry.js";

export function createSubscriptionManagement(): SubscriptionManagement {
  return {
    pauseSubscription: async (subscriptionId: string, _reason?: string) => {
      const response = await withRetry(
        () => updateSubscription(subscriptionId, { 
          pause: { 
            mode: "free",
            resumesAt: null 
          }
        }),
        "pauseSubscription"
      );

      if (response.error) {
        throw new Error(`Failed to pause subscription: ${response.error.message}`);
      }
    },

    resumeSubscription: async (subscriptionId: string) => {
      const response = await withRetry(
        () => updateSubscription(subscriptionId, { 
          pause: null 
        }),
        "resumeSubscription"
      );

      if (response.error) {
        throw new Error(`Failed to resume subscription: ${response.error.message}`);
      }
    },

    cancelSubscription: async (subscriptionId: string, _endsImmediately = false) => {
      const response = await withRetry(
        () => cancelSubscription(subscriptionId),
        "cancelSubscription"
      );

      if (response.error) {
        throw new Error(`Failed to cancel subscription: ${response.error.message}`);
      }
    },

    changeSubscriptionVariant: async (subscriptionId: string, variantId: string) => {
      const response = await withRetry(
        () => updateSubscription(subscriptionId, { variantId: parseInt(variantId) }),
        "changeSubscriptionVariant"
      );

      if (response.error) {
        throw new Error(`Failed to change subscription variant: ${response.error.message}`);
      }
    },

    resumeCancelledSubscription: async (subscriptionId: string) => {
      const response = await withRetry(
        () => updateSubscription(subscriptionId, { 
          cancelled: false 
        }),
        "resumeCancelledSubscription"
      );

      if (response.error) {
        throw new Error(`Failed to resume cancelled subscription: ${response.error.message}`);
      }
    },
  };
}
