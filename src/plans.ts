import { listStores, listProducts, listVariants } from "@lemonsqueezy/lemonsqueezy.js";
import type { StoreInfo, Plan, CachedProduct, CachedVariant } from "./types.js";
import { withRetry } from "./retry.js";

export async function fetchStores(): Promise<StoreInfo[]> {
  const response = await withRetry(
    () => listStores({ page: { number: 1, size: 100 } }),
    "listStores"
  );

  if (response.error || !response.data?.data) {
    throw new Error("Failed to fetch stores from Lemon Squeezy");
  }

  return response.data.data.map((store) => ({
    id: store.id,
    name: store.attributes.name,
    slug: store.attributes.slug,
    currency: store.attributes.currency,
  }));
}

export async function fetchProducts(storeId: string): Promise<CachedProduct[]> {
  const response = await withRetry(
    () => listProducts({ filter: { storeId }, page: { number: 1, size: 100 } }),
    "listProducts"
  );

  if (response.error || !response.data?.data) {
    throw new Error(`Failed to fetch products for store ${storeId}`);
  }

  const products: CachedProduct[] = [];

  for (const product of response.data.data) {
    const attrs = product.attributes;
    if (attrs.status !== "published") continue;

    const variants = await fetchVariants(product.id);
    products.push({
      id: product.id,
      name: attrs.name,
      description: attrs.description,
      status: attrs.status,
      variants,
    });
  }

  return products;
}

async function fetchVariants(productId: string): Promise<CachedVariant[]> {
  const response = await withRetry(
    () => listVariants({ filter: { productId }, page: { number: 1, size: 100 } }),
    "listVariants"
  );

  if (response.error || !response.data?.data) return [];

  return response.data.data.map((variant) => {
    const vAttrs = variant.attributes;
    return {
      id: variant.id,
      name: vAttrs.name,
      price: vAttrs.price,
      priceFormatted: `$${(vAttrs.price / 100).toFixed(2)}`,
      isSubscription: vAttrs.is_subscription,
      status: vAttrs.status,
    };
  });
}

export function flattenPlans(products: CachedProduct[]): Plan[] {
  const plans: Plan[] = [];

  for (const product of products) {
    for (const variant of product.variants) {
      plans.push({
        id: variant.id,
        variantId: variant.id,
        productId: product.id,
        name: product.name,
        variantName: variant.name,
        price: variant.price,
        priceFormatted: variant.priceFormatted,
        currency: "USD",
        isSubscription: variant.isSubscription,
        status: variant.status,
      });
    }
  }

  return plans;
}
