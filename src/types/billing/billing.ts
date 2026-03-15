import type { DedupBackend } from '../config/types.js';
import type { StoreInfo, Plan } from '../cache/types.js';
import type { LicenseKeyEvent } from '../license/types.js';
import type { CustomerLookup } from '../cache/types.js';
import type { CheckoutParams, ExpressRouterOptions } from './types.js';
import type { WebhookPayload } from '../webhook/types.js';
import type {
  HealthCheckResult,
  SubscriptionManagement,
  LicenseKeyManagement,
  CustomerManagement,
  WebhookManagement,
  StoreManagement,
  OrderManagement,
  DiscountManagement,
  CatalogManagement,
  CheckoutManagement,
  AffiliateManagement,
} from '../management/types.js';

export interface Billing extends
  SubscriptionManagement,
  LicenseKeyManagement,
  CustomerManagement,
  WebhookManagement,
  StoreManagement,
  OrderManagement,
  DiscountManagement,
  CatalogManagement,
  CheckoutManagement,
  AffiliateManagement {
  stores: StoreInfo[];
  plans: Plan[];
  createCheckout: (params: CheckoutParams) => Promise<string>;
  verifyWebhook: (rawBody: string, signature: string) => boolean;
  handleWebhook: (payload: WebhookPayload) => Promise<void>;
  refreshPlans: () => Promise<void>;
  getCustomerPortal: (customerId: string) => Promise<string>;
  getExpressRouter: (options: ExpressRouterOptions) => unknown;

  dedupBackend: DedupBackend;

  healthCheck: () => Promise<HealthCheckResult>;
}
