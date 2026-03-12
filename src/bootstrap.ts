import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";
import type { BillingConfig, BillingCache, StoreInfo, Plan } from "./types.js";
import { fetchStores, fetchProducts, flattenPlans } from "./plans.js";
import { readCache, writeCache, isCacheValid } from "./cache.js";

export interface BootstrapResult {
  stores: StoreInfo[];
  plans: Plan[];
  cache: BillingCache;
}

export async function bootstrap(config: BillingConfig): Promise<BootstrapResult> {
  lemonSqueezySetup({ apiKey: config.apiKey });

  const existingCache = readCache(config.cachePath);
  if (isCacheValid(existingCache, config.cacheTtlMs) && existingCache) {
    const plans = flattenPlans(existingCache.products);
    return {
      stores: [existingCache.store],
      plans,
      cache: existingCache,
    };
  }

  const stores = await fetchStores();

  if (stores.length === 0) {
    throw new Error("No stores found for this API key. Verify your Lemon Squeezy API key.");
  }

  const selectedStore = config.storeId
    ? stores.find((s) => s.id === config.storeId)
    : stores[0];

  if (!selectedStore) {
    const available = stores.map((s) => `${s.name} (${s.id})`).join(", ");
    throw new Error(`Store "${config.storeId}" not found. Available: ${available}`);
  }

  const products = await fetchProducts(selectedStore.id);

  if (products.length === 0) {
    throw new Error(
      `No published products found for store ${selectedStore.id}. Create products in the Lemon Squeezy dashboard first.`
    );
  }

  const cache: BillingCache = {
    generatedAt: new Date().toISOString(),
    store: selectedStore,
    products,
  };

  writeCache(cache, config.cachePath);

  return {
    stores,
    plans: flattenPlans(products),
    cache,
  };
}
