import { getStore, listStores, getAuthenticatedUser } from "@lemonsqueezy/lemonsqueezy.js";
import { withRetry } from "./retry.js";

export interface StoreManagement {
  getStore: (storeId: string) => Promise<{ id: string; name: string; slug: string; currency: string } | null>;
  listStores: () => Promise<Array<{ id: string; name: string; slug: string; currency: string }>>;
  getAuthenticatedUser: () => Promise<{ id: string; name: string; email: string } | null>;
}

export function createStoreManagement(): StoreManagement {
  return {
    getStore: async (storeId: string) => {
      const response = await withRetry(() => getStore(storeId), "getStore");
      if (response.error) throw new Error(`Failed to get store: ${response.error.message}`);
      const s = response.data?.data;
      if (!s) return null;
      return { id: s.id, name: s.attributes.name as string, slug: s.attributes.slug as string, currency: s.attributes.currency as string };
    },

    listStores: async () => {
      const response = await withRetry(() => listStores(), "listStores");
      if (response.error) throw new Error(`Failed to list stores: ${response.error.message}`);
      return (response.data?.data ?? []).map((s: any) => ({
        id: s.id, name: s.attributes.name as string, slug: s.attributes.slug as string, currency: s.attributes.currency as string,
      }));
    },

    getAuthenticatedUser: async () => {
      const response = await withRetry(() => getAuthenticatedUser(), "getAuthenticatedUser");
      if (response.error) throw new Error(`Failed to get user: ${response.error.message}`);
      const u = response.data?.data;
      if (!u) return null;
      return { id: u.id, name: u.attributes.name as string, email: u.attributes.email as string };
    },
  };
}
