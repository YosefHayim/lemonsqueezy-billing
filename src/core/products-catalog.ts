import { getProduct, listProducts, getVariant, listVariants, getPrice, listPrices, getFile, listFiles } from "@lemonsqueezy/lemonsqueezy.js";
import { withRetry } from "./retry.js";

export interface CatalogManagement {
  getProduct: (productId: string) => Promise<Record<string, unknown> | null>;
  listProducts: (storeId?: string) => Promise<Record<string, unknown>[]>;
  getVariant: (variantId: string) => Promise<Record<string, unknown> | null>;
  listVariants: (productId?: string) => Promise<Record<string, unknown>[]>;
  getPrice: (priceId: string) => Promise<Record<string, unknown> | null>;
  listPrices: (variantId?: string) => Promise<Record<string, unknown>[]>;
  getFile: (fileId: string) => Promise<Record<string, unknown> | null>;
  listFiles: (variantId?: string) => Promise<Record<string, unknown>[]>;
}

export function createCatalogManagement(): CatalogManagement {
  return {
    getProduct: async (productId) => {
      const response = await withRetry(() => getProduct(productId), "getProduct");
      if (response.error) throw new Error(`Failed to get product: ${response.error.message}`);
      return response.data?.data?.attributes ?? null;
    },
    listProducts: async (storeId) => {
      const response = await withRetry(() => listProducts({ filter: { storeId } }), "listProducts");
      if (response.error) throw new Error(`Failed to list products: ${response.error.message}`);
      return (response.data?.data ?? []).map((p: any) => ({ id: p.id, ...p.attributes }));
    },
    getVariant: async (variantId) => {
      const response = await withRetry(() => getVariant(variantId), "getVariant");
      if (response.error) throw new Error(`Failed to get variant: ${response.error.message}`);
      return response.data?.data?.attributes ?? null;
    },
    listVariants: async (productId) => {
      const response = await withRetry(() => listVariants({ filter: { productId } }), "listVariants");
      if (response.error) throw new Error(`Failed to list variants: ${response.error.message}`);
      return (response.data?.data ?? []).map((v: any) => ({ id: v.id, ...v.attributes }));
    },
    getPrice: async (priceId) => {
      const response = await withRetry(() => getPrice(priceId), "getPrice");
      if (response.error) throw new Error(`Failed to get price: ${response.error.message}`);
      return response.data?.data?.attributes ?? null;
    },
    listPrices: async (variantId) => {
      const response = await withRetry(() => listPrices({ filter: { variantId } }), "listPrices");
      if (response.error) throw new Error(`Failed to list prices: ${response.error.message}`);
      return (response.data?.data ?? []).map((p: any) => ({ id: p.id, ...p.attributes }));
    },
    getFile: async (fileId) => {
      const response = await withRetry(() => getFile(fileId), "getFile");
      if (response.error) throw new Error(`Failed to get file: ${response.error.message}`);
      return response.data?.data?.attributes ?? null;
    },
    listFiles: async (variantId) => {
      const response = await withRetry(() => listFiles({ filter: { variantId } }), "listFiles");
      if (response.error) throw new Error(`Failed to list files: ${response.error.message}`);
      return (response.data?.data ?? []).map((f: any) => ({ id: f.id, ...f.attributes }));
    },
  };
}
