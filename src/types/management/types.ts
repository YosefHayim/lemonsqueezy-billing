import type { LicenseKeyEvent } from '../license/types.js';
import type { CustomerLookup } from '../cache/types.js';

export interface Affiliate {
  id: string;
  storeId: number;
  userId: number;
  userName: string;
  userEmail: string;
  shareDomain: string;
  status: 'active' | 'pending' | 'disabled';
  applicationNote: string | null;
  products: unknown | null;
  totalEarnings: number;
  unpaidEarnings: number;
  createdAt: string;
  updatedAt: string;
}

export interface AffiliateManagement {
  listAffiliates: (storeId?: string) => Promise<Affiliate[]>;
  getAffiliate: (affiliateId: string) => Promise<Affiliate | null>;
}

export interface SubscriptionManagement {
  pauseSubscription: (subscriptionId: string, reason?: string) => Promise<void>;
  resumeSubscription: (subscriptionId: string) => Promise<void>;
  cancelSubscription: (subscriptionId: string, endsImmediately?: boolean) => Promise<void>;
  changeSubscriptionVariant: (subscriptionId: string, variantId: string) => Promise<void>;
  resumeCancelledSubscription: (subscriptionId: string) => Promise<void>;
  getSubscription: (subscriptionId: string) => Promise<Record<string, unknown> | null>;
  listSubscriptions: (filter?: Record<string, unknown>) => Promise<Record<string, unknown>[]>;
  getSubscriptionInvoice: (invoiceId: string) => Promise<Record<string, unknown> | null>;
  listSubscriptionInvoices: (filter?: Record<string, unknown>) => Promise<Record<string, unknown>[]>;
  generateSubscriptionInvoice: (invoiceId: string) => Promise<void>;
  issueSubscriptionInvoiceRefund: (invoiceId: string, amount: number) => Promise<void>;
  getSubscriptionItem: (itemId: string) => Promise<Record<string, unknown> | null>;
  listSubscriptionItems: (subscriptionId?: string) => Promise<Record<string, unknown>[]>;
  getSubscriptionItemCurrentUsage: (itemId: string) => Promise<Record<string, unknown> | null>;
  createUsageRecord: (subscriptionItemId: string, quantity: number, action?: 'increment' | 'set') => Promise<string | null>;
  listUsageRecords: (subscriptionItemId?: string) => Promise<Record<string, unknown>[]>;
}

export interface LicenseKeyManagement {
  validateLicense: (key: string) => Promise<{ valid: boolean; details?: LicenseKeyEvent }>;
  getLicenseDetails: (key: string) => Promise<LicenseKeyEvent | null>;
  activateLicense: (key: string, instanceName?: string) => Promise<{ activated: boolean; instanceId?: string }>;
  deactivateLicense: (key: string, instanceId?: string) => Promise<boolean>;
  listLicenseKeys: (filter?: Record<string, unknown>) => Promise<Record<string, unknown>[]>;
  getLicenseKeyInstance: (instanceId: string) => Promise<Record<string, unknown> | null>;
  listLicenseKeyInstances: (licenseKeyId?: string) => Promise<Record<string, unknown>[]>;
  updateLicenseKey: (licenseKeyId: string, params: { disabled?: boolean; activationLimit?: number }) => Promise<void>;
}

export interface CustomerManagement {
  getCustomerByEmail: (email: string) => Promise<CustomerLookup | null>;
  getSubscriptionsForUser: (userId: string) => Promise<CustomerLookup['subscriptions']>;
  getCustomer: (customerId: string) => Promise<Record<string, unknown> | null>;
  createCustomer: (storeId: string, name: string, email: string) => Promise<string>;
  updateCustomer: (customerId: string, params: { name?: string; email?: string }) => Promise<void>;
  archiveCustomer: (customerId: string) => Promise<void>;
}

export interface WebhookInfo {
  id: string;
  url: string;
  events: string[];
  lastSentAt: string | null;
  testMode: boolean;
  createdAt: string;
}

export interface WebhookManagement {
  createWebhook: (url: string, events: string[], secret?: string) => Promise<string>;
  deleteWebhook: (webhookId: string) => Promise<void>;
  listWebhooks: () => Promise<WebhookInfo[]>;
  getWebhook: (webhookId: string) => Promise<WebhookInfo | null>;
  updateWebhook: (webhookId: string, url?: string, events?: string[]) => Promise<void>;
}

export interface StoreInfoDetail {
  id: string;
  name: string;
  slug: string;
  currency: string;
  domain: string;
  url: string;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface StoreManagement {
  getStore: (storeId: string) => Promise<StoreInfoDetail | null>;
  listStores: () => Promise<StoreInfoDetail[]>;
  getAuthenticatedUser: () => Promise<UserInfo | null>;
}

export interface OrderManagement {
  getOrder: (orderId: string) => Promise<Record<string, unknown> | null>;
  listOrders: (filter?: { storeId?: string; userEmail?: string }) => Promise<Record<string, unknown>[]>;
  generateOrderInvoice: (orderId: string) => Promise<void>;
  issueOrderRefund: (orderId: string, amount: number) => Promise<void>;
  getOrderItem: (orderItemId: string) => Promise<Record<string, unknown> | null>;
  listOrderItems: (filter?: { orderId?: string }) => Promise<Record<string, unknown>[]>;
}

export interface DiscountManagement {
  createDiscount: (storeId: string, params: { name: string; code: string; amount: number; amountType?: 'fixed' | 'percent'; expiresAt?: string }) => Promise<string>;
  deleteDiscount: (discountId: string) => Promise<void>;
  getDiscount: (discountId: string) => Promise<Record<string, unknown> | null>;
  listDiscounts: (storeId?: string) => Promise<Record<string, unknown>[]>;
  getDiscountRedemption: (redemptionId: string) => Promise<Record<string, unknown> | null>;
  listDiscountRedemptions: (discountId?: string) => Promise<Record<string, unknown>[]>;
}

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

export interface CheckoutManagement {
  getCheckout: (checkoutId: string) => Promise<Record<string, unknown> | null>;
  listCheckouts: (storeId?: string, variantId?: string) => Promise<Record<string, unknown>[]>;
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  details: {
    apiConnectivity: boolean;
    cacheValid: boolean;
    webhookSecretConfigured: boolean;
    storeAccessible: boolean;
  };
  timestamp: string;
}
