import { getStore, listStores, getAuthenticatedUser } from "@lemonsqueezy/lemonsqueezy.js";
import type { StoreManagement } from "../types/index.js";
import { withRetry } from "./retry.js";

export function createStoreManagement(): StoreManagement {
  return {
    getStore: async (storeId: string) => {
      const response = await withRetry(() => getStore(storeId), "getStore");
      if (response.error) throw new Error(`Failed to get store: ${response.error.message}`);
      const s = response.data?.data;
      if (!s) return null;
      return {
        id: s.id,
        name: s.attributes.name as string,
        slug: s.attributes.slug as string,
        currency: s.attributes.currency as string,
        domain: (s.attributes as Record<string, unknown>).domain as string ?? "",
        url: (s.attributes as Record<string, unknown>).url as string ?? "",
      };
    },

    listStores: async () => {
      const response = await withRetry(() => listStores(), "listStores");
      if (response.error) throw new Error(`Failed to list stores: ${response.error.message}`);
      return (response.data?.data ?? []).map((s: any) => ({
        id: s.id,
        name: s.attributes.name as string,
        slug: s.attributes.slug as string,
        currency: s.attributes.currency as string,
        domain: (s.attributes.domain as string) ?? "",
        url: (s.attributes.url as string) ?? "",
      }));
    },

    getAuthenticatedUser: async () => {
      const response = await withRetry(() => getAuthenticatedUser(), "getAuthenticatedUser");
      if (response.error) throw new Error(`Failed to get user: ${response.error.message}`);
      const u = response.data?.data;
      if (!u) return null;
      return {
        id: u.id,
        name: u.attributes.name as string,
        email: u.attributes.email as string,
        avatarUrl: (u.attributes as Record<string, unknown>).avatar_url as string ?? null,
      };
    },
  };
}
