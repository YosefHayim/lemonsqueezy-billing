import { getCheckout, listCheckouts } from "@lemonsqueezy/lemonsqueezy.js";
import { withRetry } from "./retry.js";

export interface CheckoutManagement {
  getCheckout: (checkoutId: string) => Promise<Record<string, unknown> | null>;
  listCheckouts: (storeId?: string, variantId?: string) => Promise<Record<string, unknown>[]>;
}

export function createCheckoutManagement(): CheckoutManagement {
  return {
    getCheckout: async (checkoutId) => {
      const response = await withRetry(() => getCheckout(checkoutId), "getCheckout");
      if (response.error) throw new Error(`Failed to get checkout: ${response.error.message}`);
      return response.data?.data?.attributes ?? null;
    },

    listCheckouts: async (storeId, variantId) => {
      const response = await withRetry(() => listCheckouts({ filter: { storeId, variantId } }), "listCheckouts");
      if (response.error) throw new Error(`Failed to list checkouts: ${response.error.message}`);
      return (response.data?.data ?? []).map((c: any) => ({ id: c.id, ...c.attributes }));
    },
  };
}
