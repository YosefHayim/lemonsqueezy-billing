export { createBilling } from "./createBilling.js";
export type {
  Billing,
  BillingConfig,
  BillingCallbacks,
  BillingLogger,
  LoggerConfig,
  OrderEvent,
  OrderMethod,
  SubscriptionEvent,
  SubscriptionMethod,
  PaymentFailedEvent,
  SubscriptionPausedEvent,
  SubscriptionResumedEvent,
  SubscriptionPaymentSuccessEvent,
  SubscriptionPaymentRecoveredEvent,
  AnySubscriptionEvent,
  LicenseKeyEvent,
  LicenseMethod,
  StoreInfo,
  Plan,
  BillingCache,
  CachedProduct,
  CachedVariant,
  CheckoutParams,
  WebhookPayload,
  ExpressRouterOptions,
  SubscriptionManagement,
  LicenseKeyManagement,
  CustomerManagement,
  WebhookManagement,
  StoreManagement,
  OrderManagement,
  DiscountManagement,
  CatalogManagement,
  CheckoutManagement,
  DedupBackend,
  DedupConfig,
  HealthCheckResult,
  WebhookMethod,
  WebhookEvent,
} from "../types/index.js";

// Export individual management classes for advanced usage
export { createSubscriptionManagement } from "./subscriptions.js";
export { createLicenseKeyManagement } from "./licenses.js";
export { createCustomerManagement } from "./customers.js";
export { createWebhookManagement } from "./webhooks.js";
export { createStoreManagement } from "./stores.js";
export { createOrderManagement } from "./orders.js";
export { createDiscountManagement } from "./discounts.js";
export { createCatalogManagement } from "./products-catalog.js";
export { createCheckoutManagement } from "./checkouts-management.js";
export { createDedupBackend, InMemoryDedupBackend, RedisDedupBackend, DatabaseDedupBackend, type RedisClient, type DatabaseClient } from "./dedup.js";
export { healthCheck } from "./health.js";
