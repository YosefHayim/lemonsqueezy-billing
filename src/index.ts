export { createBilling } from "./createBilling.js";
export type {
  Billing,
  BillingConfig,
  BillingCallbacks,
  BillingLogger,
  LoggerConfig,
  PurchaseEvent,
  RefundEvent,
  SubscriptionEvent,
  PaymentFailedEvent,
  SubscriptionPausedEvent,
  SubscriptionResumedEvent,
  SubscriptionPaymentSuccessEvent,
  SubscriptionPaymentRecoveredEvent,
  LicenseKeyEvent,
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
  DedupBackend,
  DedupConfig,
  HealthCheckResult,
} from "./types.js";

// Export individual management classes for advanced usage
export { createSubscriptionManagement } from "./subscriptions.js";
export { createLicenseKeyManagement } from "./licenses.js";
export { createCustomerManagement } from "./customers.js";
export { createWebhookManagement } from "./webhooks.js";
export { createDedupBackend, InMemoryDedupBackend, RedisDedupBackend, DatabaseDedupBackend, type RedisClient, type DatabaseClient } from "./dedup.js";
export { healthCheck } from "./health.js";
