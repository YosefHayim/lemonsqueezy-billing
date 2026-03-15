import { getOrder, listOrders, generateOrderInvoice, issueOrderRefund, getOrderItem, listOrderItems } from "@lemonsqueezy/lemonsqueezy.js";
import { withRetry } from "./retry.js";

export interface OrderManagement {
  getOrder: (orderId: string) => Promise<Record<string, unknown> | null>;
  listOrders: (filter?: { storeId?: string; userEmail?: string }) => Promise<Record<string, unknown>[]>;
  generateOrderInvoice: (orderId: string) => Promise<void>;
  issueOrderRefund: (orderId: string, amount: number) => Promise<void>;
  getOrderItem: (orderItemId: string) => Promise<Record<string, unknown> | null>;
  listOrderItems: (filter?: { orderId?: string }) => Promise<Record<string, unknown>[]>;
}

export function createOrderManagement(): OrderManagement {
  return {
    getOrder: async (orderId: string) => {
      const response = await withRetry(() => getOrder(orderId), "getOrder");
      if (response.error) throw new Error(`Failed to get order: ${response.error.message}`);
      return response.data?.data?.attributes ?? null;
    },

    listOrders: async (filter = {}) => {
      const response = await withRetry(() => listOrders({ filter: { storeId: filter.storeId, userEmail: filter.userEmail } }), "listOrders");
      if (response.error) throw new Error(`Failed to list orders: ${response.error.message}`);
      return (response.data?.data ?? []).map((o: any) => ({ id: o.id, ...o.attributes }));
    },

    generateOrderInvoice: async (orderId: string) => {
      const response = await withRetry(() => generateOrderInvoice(orderId), "generateOrderInvoice");
      if (response.error) throw new Error(`Failed to generate invoice: ${response.error.message}`);
    },

    issueOrderRefund: async (orderId: string, amount: number) => {
      const response = await withRetry(() => issueOrderRefund(orderId, amount), "issueOrderRefund");
      if (response.error) throw new Error(`Failed to issue refund: ${response.error.message}`);
    },

    getOrderItem: async (orderItemId: string) => {
      const response = await withRetry(() => getOrderItem(orderItemId), "getOrderItem");
      if (response.error) throw new Error(`Failed to get order item: ${response.error.message}`);
      return response.data?.data?.attributes ?? null;
    },

    listOrderItems: async (filter = {}) => {
      const response = await withRetry(() => listOrderItems({ filter: { orderId: filter.orderId } }), "listOrderItems");
      if (response.error) throw new Error(`Failed to list order items: ${response.error.message}`);
      return (response.data?.data ?? []).map((o: any) => ({ id: o.id, ...o.attributes }));
    },
  };
}
