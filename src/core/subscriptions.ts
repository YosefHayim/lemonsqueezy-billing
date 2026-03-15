import {
  updateSubscription,
  cancelSubscription,
  getSubscription,
  listSubscriptions,
  getSubscriptionInvoice,
  listSubscriptionInvoices,
  generateSubscriptionInvoice,
  issueSubscriptionInvoiceRefund,
  getSubscriptionItem,
  listSubscriptionItems,
  getSubscriptionItemCurrentUsage,
  createUsageRecord,
  listUsageRecords,
} from "@lemonsqueezy/lemonsqueezy.js";
import type { SubscriptionManagement } from "../types/index.js";
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

    getSubscription: async (subscriptionId: string) => {
      const response = await withRetry(() => getSubscription(subscriptionId), "getSubscription");
      if (response.error) throw new Error(`Failed to get subscription: ${response.error.message}`);
      return response.data?.data?.attributes ?? null;
    },

    listSubscriptions: async (filter = {}) => {
      const response = await withRetry(() => listSubscriptions({ filter }), "listSubscriptions");
      if (response.error) throw new Error(`Failed to list subscriptions: ${response.error.message}`);
      return (response.data?.data ?? []).map((s: any) => ({ id: s.id, ...s.attributes }));
    },

    getSubscriptionInvoice: async (invoiceId: string) => {
      const response = await withRetry(() => getSubscriptionInvoice(invoiceId), "getSubscriptionInvoice");
      if (response.error) throw new Error(`Failed to get subscription invoice: ${response.error.message}`);
      return response.data?.data?.attributes ?? null;
    },

    listSubscriptionInvoices: async (filter = {}) => {
      const response = await withRetry(() => listSubscriptionInvoices({ filter }), "listSubscriptionInvoices");
      if (response.error) throw new Error(`Failed to list subscription invoices: ${response.error.message}`);
      return (response.data?.data ?? []).map((i: any) => ({ id: i.id, ...i.attributes }));
    },

    generateSubscriptionInvoice: async (invoiceId: string) => {
      const response = await withRetry(() => generateSubscriptionInvoice(invoiceId), "generateSubscriptionInvoice");
      if (response.error) throw new Error(`Failed to generate subscription invoice: ${response.error.message}`);
    },

    issueSubscriptionInvoiceRefund: async (invoiceId: string, amount: number) => {
      const response = await withRetry(() => issueSubscriptionInvoiceRefund(invoiceId, amount), "issueSubscriptionInvoiceRefund");
      if (response.error) throw new Error(`Failed to refund subscription invoice: ${response.error.message}`);
    },

    getSubscriptionItem: async (itemId: string) => {
      const response = await withRetry(() => getSubscriptionItem(itemId), "getSubscriptionItem");
      if (response.error) throw new Error(`Failed to get subscription item: ${response.error.message}`);
      return response.data?.data?.attributes ?? null;
    },

    listSubscriptionItems: async (subscriptionId?: string) => {
      const response = await withRetry(() => listSubscriptionItems({ filter: { subscriptionId } }), "listSubscriptionItems");
      if (response.error) throw new Error(`Failed to list subscription items: ${response.error.message}`);
      return (response.data?.data ?? []).map((i: any) => ({ id: i.id, ...i.attributes }));
    },

    getSubscriptionItemCurrentUsage: async (itemId: string) => {
      const response = await withRetry(() => getSubscriptionItemCurrentUsage(itemId), "getSubscriptionItemCurrentUsage");
      if (response.error) throw new Error(`Failed to get subscription item usage: ${response.error.message}`);
      return (response.data?.meta as Record<string, unknown>) ?? null;
    },

    createUsageRecord: async (subscriptionItemId: string, quantity: number, action: 'increment' | 'set' = 'increment') => {
      const response = await withRetry(() => createUsageRecord({ subscriptionItemId, quantity, action }), "createUsageRecord");
      if (response.error) throw new Error(`Failed to create usage record: ${response.error.message}`);
      return response.data?.data?.id ?? null;
    },

    listUsageRecords: async (subscriptionItemId?: string) => {
      const response = await withRetry(() => listUsageRecords({ filter: { subscriptionItemId } }), "listUsageRecords");
      if (response.error) throw new Error(`Failed to list usage records: ${response.error.message}`);
      return (response.data?.data ?? []).map((r: any) => ({ id: r.id, ...r.attributes }));
    },
  };
}
