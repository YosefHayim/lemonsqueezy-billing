export interface StoreInfo {
  id: string;
  name: string;
  slug: string;
  currency: string;
}

export interface Plan {
  id: string;
  variantId: string;
  productId: string;
  name: string;
  variantName: string;
  price: number;
  priceFormatted: string;
  currency: string;
  isSubscription: boolean;
  status: string;
}

export interface BillingCache {
  generatedAt: string;
  store: StoreInfo;
  products: CachedProduct[];
}

export interface CachedProduct {
  id: string;
  name: string;
  description: string;
  status: string;
  variants: CachedVariant[];
}

export interface CachedVariant {
  id: string;
  name: string;
  price: number;
  priceFormatted: string;
  isSubscription: boolean;
  status: string;
}

export interface CustomerLookup {
  id: string;
  email: string;
  name: string;
  billingAddress?: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    country: string;
    zip: string;
    state?: string;
  };
  subscriptions: {
    id: string;
    status: string;
    variantId: string;
    productId: string;
    price: number;
    nextBillingDate?: string;
    endsAt?: string;
  }[];
}
