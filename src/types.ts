export interface BillingLogger {
  info: (entry: Record<string, unknown>) => void;
  warn: (entry: Record<string, unknown>) => void;
  error: (entry: Record<string, unknown>) => void;
}

export type LoggerConfig =
  | { filePath: string; custom?: never }
  | { custom: BillingLogger; filePath?: never };

export interface BillingConfig {
  apiKey: string;
  storeId?: string;
  webhookSecret?: string;
  cachePath?: string;
  cacheTtlMs?: number;
  checkoutExpiresInMs?: number | null;
  logger?: LoggerConfig;
  callbacks: BillingCallbacks;
  dedup?: DedupConfig;
}

export interface BillingCallbacks {
  onPurchase: (event: PurchaseEvent) => Promise<void>;
  onRefund?: (event: RefundEvent) => Promise<void>;
  onSubscriptionCreated?: (event: SubscriptionEvent) => Promise<void>;
  onSubscriptionUpdated?: (event: SubscriptionEvent) => Promise<void>;
  onSubscriptionCancelled?: (event: SubscriptionEvent) => Promise<void>;
  onSubscriptionExpired?: (event: SubscriptionEvent) => Promise<void>;
  onPaymentFailed?: (event: PaymentFailedEvent) => Promise<void>;
  onSubscriptionPaused?: (event: SubscriptionPausedEvent) => Promise<void>;
  onSubscriptionResumed?: (event: SubscriptionResumedEvent) => Promise<void>;
  onSubscriptionPaymentSuccess?: (event: SubscriptionPaymentSuccessEvent) => Promise<void>;
  onSubscriptionPaymentRecovered?: (event: SubscriptionPaymentRecoveredEvent) => Promise<void>;
  onLicenseKeyCreated?: (event: LicenseKeyEvent) => Promise<void>;
  onLicenseKeyUpdated?: (event: LicenseKeyEvent) => Promise<void>;
}

export interface PurchaseEvent {
  userId: string;
  email: string;
  orderId: string;
  customerId: string;
  variantId: string;
  productName: string;
  price: number;
}

export interface RefundEvent {
  userId: string;
  email: string;
  orderId: string;
}

export interface SubscriptionEvent {
  userId: string;
  email: string;
  subscriptionId: string;
  customerId: string;
  variantId: string;
  status: string;
}

export interface PaymentFailedEvent {
  userId: string;
  email: string;
  subscriptionId: string;
  customerId: string;
  reason: string;
}

export interface SubscriptionPausedEvent {
  userId: string;
  email: string;
  subscriptionId: string;
  customerId: string;
  reason?: string;
}

export interface SubscriptionResumedEvent {
  userId: string;
  email: string;
  subscriptionId: string;
  customerId: string;
}

export interface SubscriptionPaymentSuccessEvent {
  userId: string;
  email: string;
  subscriptionId: string;
  customerId: string;
  orderId: string;
  amount: number;
}

export interface SubscriptionPaymentRecoveredEvent {
  userId: string;
  email: string;
  subscriptionId: string;
  customerId: string;
  orderId: string;
  amount: number;
}

export interface LicenseKeyEvent {
  userId: string;
  email: string;
  licenseKeyId: string;
  key: string;
  productId: string;
  variantId: string;
  status: string;
  activationCount: number;
  maxActivations: number;
}

// LemonSqueezy API response types - maps SDK response to our internal format
export interface LemonSqueezyLicenseKeyAttributes {
  store_id: number;
  customer_id: number;
  order_id: number;
  order_item_id: number;
  product_id: number;
  user_name: string;
  user_email: string;
  key: string;
  key_short: string;
  activation_limit: number;
  instances_count: number;
  disabled: number;
  status: string;
  status_formatted: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
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

export interface CheckoutParams {
  variantId: string;
  email: string;
  userId: string;
  redirectUrl?: string;
  discountCode?: string;
  name?: string;
  customPrice?: number;
  enabledVariants?: string[];
  locale?: string;
}

export interface WebhookPayload {
  meta: {
    event_name: string;
    custom_data?: Record<string, unknown>;
    test_mode: boolean;
  };
  data: {
    id: string;
    type: string;
    attributes: Record<string, unknown>;
  };
}

export interface ExpressRouterOptions {
  requireAuth?: (req: unknown, res: unknown, next: () => void) => void;
  getUserId: (req: unknown) => string;
  getUserEmail: (req: unknown) => string;
}

export interface Billing {
  stores: StoreInfo[];
  plans: Plan[];
  createCheckout: (params: CheckoutParams) => Promise<string>;
  verifyWebhook: (rawBody: string, signature: string) => boolean;
  handleWebhook: (payload: WebhookPayload) => Promise<void>;
  refreshPlans: () => Promise<void>;
  getCustomerPortal: (customerId: string) => Promise<string>;
  getExpressRouter: (options: ExpressRouterOptions) => unknown;

  // Subscription Management
  pauseSubscription: (subscriptionId: string, reason?: string) => Promise<void>;
  resumeSubscription: (subscriptionId: string) => Promise<void>;
  cancelSubscription: (subscriptionId: string, endsImmediately?: boolean) => Promise<void>;
  changeSubscriptionVariant: (subscriptionId: string, variantId: string) => Promise<void>;
  resumeCancelledSubscription: (subscriptionId: string) => Promise<void>;

  // License Key Management
  validateLicense: (key: string) => Promise<{ valid: boolean; details?: LicenseKeyEvent }>;
  getLicenseDetails: (key: string) => Promise<LicenseKeyEvent | null>;
  activateLicense: (key: string, instanceId?: string) => Promise<boolean>;
  deactivateLicense: (key: string, instanceId?: string) => Promise<boolean>;

  // Customer Management
  getCustomerByEmail: (email: string) => Promise<CustomerLookup | null>;
  getSubscriptionsForUser: (userId: string) => Promise<CustomerLookup['subscriptions']>;

  // Webhook Management
  createWebhook: (url: string, events: string[], secret?: string) => Promise<string>;
  deleteWebhook: (webhookId: string) => Promise<void>;

  // Deduplication
  dedupBackend: DedupBackend;

  // Health Check
  healthCheck: () => Promise<HealthCheckResult>;
}

export interface SubscriptionManagement {
  pauseSubscription: (subscriptionId: string, reason?: string) => Promise<void>;
  resumeSubscription: (subscriptionId: string) => Promise<void>;
  cancelSubscription: (subscriptionId: string, endsImmediately?: boolean) => Promise<void>;
  changeSubscriptionVariant: (subscriptionId: string, variantId: string) => Promise<void>;
  resumeCancelledSubscription: (subscriptionId: string) => Promise<void>;
}

export interface LicenseKeyManagement {
  validateLicense: (key: string) => Promise<{ valid: boolean; details?: LicenseKeyEvent }>;
  getLicenseDetails: (key: string) => Promise<LicenseKeyEvent | null>;
  activateLicense: (key: string, instanceId?: string) => Promise<boolean>;
  deactivateLicense: (key: string, instanceId?: string) => Promise<boolean>;
}

export interface CustomerManagement {
  getCustomerByEmail: (email: string) => Promise<CustomerLookup | null>;
  getSubscriptionsForUser: (userId: string) => Promise<CustomerLookup['subscriptions']>;
}

export interface WebhookManagement {
  createWebhook: (url: string, events: string[], secret?: string) => Promise<string>;
  deleteWebhook: (webhookId: string) => Promise<void>;
}

export interface DedupBackend {
  isDuplicate: (key: string) => Promise<boolean>;
  markDuplicate: (key: string, ttlMs: number) => Promise<void>;
}

export interface DedupConfig {
  backend?: DedupBackend;
  ttlMs?: number;
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
