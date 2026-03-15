import { createDiscount, deleteDiscount, getDiscount, listDiscounts, getDiscountRedemption, listDiscountRedemptions } from "@lemonsqueezy/lemonsqueezy.js";
import { withRetry } from "./retry.js";

export interface DiscountManagement {
  createDiscount: (storeId: string, params: { name: string; code: string; amount: number; amountType?: 'fixed' | 'percent'; expiresAt?: string }) => Promise<string>;
  deleteDiscount: (discountId: string) => Promise<void>;
  getDiscount: (discountId: string) => Promise<Record<string, unknown> | null>;
  listDiscounts: (storeId?: string) => Promise<Record<string, unknown>[]>;
  getDiscountRedemption: (redemptionId: string) => Promise<Record<string, unknown> | null>;
  listDiscountRedemptions: (discountId?: string) => Promise<Record<string, unknown>[]>;
}

export function createDiscountManagement(): DiscountManagement {
  return {
    createDiscount: async (storeId, params) => {
      const response = await withRetry(
        () => createDiscount({ storeId, name: params.name, code: params.code, amount: params.amount, amountType: params.amountType ?? 'fixed', expiresAt: params.expiresAt ?? null }),
        "createDiscount"
      );
      if (response.error) throw new Error(`Failed to create discount: ${response.error.message}`);
      if (!response.data?.data) throw new Error("Discount created but no data returned");
      return response.data.data.id;
    },

    deleteDiscount: async (discountId) => {
      const response = await withRetry(() => deleteDiscount(discountId), "deleteDiscount");
      if (response.error) throw new Error(`Failed to delete discount: ${response.error.message}`);
    },

    getDiscount: async (discountId) => {
      const response = await withRetry(() => getDiscount(discountId), "getDiscount");
      if (response.error) throw new Error(`Failed to get discount: ${response.error.message}`);
      return response.data?.data?.attributes ?? null;
    },

    listDiscounts: async (storeId) => {
      const response = await withRetry(() => listDiscounts({ filter: { storeId } }), "listDiscounts");
      if (response.error) throw new Error(`Failed to list discounts: ${response.error.message}`);
      return (response.data?.data ?? []).map((d: any) => ({ id: d.id, ...d.attributes }));
    },

    getDiscountRedemption: async (redemptionId) => {
      const response = await withRetry(() => getDiscountRedemption(redemptionId), "getDiscountRedemption");
      if (response.error) throw new Error(`Failed to get discount redemption: ${response.error.message}`);
      return response.data?.data?.attributes ?? null;
    },

    listDiscountRedemptions: async (discountId) => {
      const response = await withRetry(() => listDiscountRedemptions({ filter: { discountId } }), "listDiscountRedemptions");
      if (response.error) throw new Error(`Failed to list redemptions: ${response.error.message}`);
      return (response.data?.data ?? []).map((r: any) => ({ id: r.id, ...r.attributes }));
    },
  };
}
