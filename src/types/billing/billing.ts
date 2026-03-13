import type { DedupBackend } from '../config/types.js';
import type { StoreInfo, Plan } from '../cache/types.js';
import type { LicenseKeyEvent } from '../license/types.js';
import type { CustomerLookup } from '../cache/types.js';
import type { CheckoutParams, ExpressRouterOptions } from './types.js';
import type { WebhookPayload } from '../webhook/types.js';
import type { HealthCheckResult } from '../management/types.js';

export interface Billing {
  stores: StoreInfo[];
  plans: Plan[];
  createCheckout: (params: CheckoutParams) => Promise<string>;
  verifyWebhook: (rawBody: string, signature: string) => boolean;
  handleWebhook: (payload: WebhookPayload) => Promise<void>;
  refreshPlans: () => Promise<void>;
  getCustomerPortal: (customerId: string) => Promise<string>;
  getExpressRouter: (options: ExpressRouterOptions) => unknown;

  pauseSubscription: (subscriptionId: string, reason?: string) => Promise<void>;
  resumeSubscription: (subscriptionId: string) => Promise<void>;
  cancelSubscription: (subscriptionId: string, endsImmediately?: boolean) => Promise<void>;
  changeSubscriptionVariant: (subscriptionId: string, variantId: string) => Promise<void>;
  resumeCancelledSubscription: (subscriptionId: string) => Promise<void>;

  validateLicense: (key: string) => Promise<{ valid: boolean; details?: LicenseKeyEvent }>;
  getLicenseDetails: (key: string) => Promise<LicenseKeyEvent | null>;
  activateLicense: (key: string, instanceId?: string) => Promise<boolean>;
  deactivateLicense: (key: string, instanceId?: string) => Promise<boolean>;

  getCustomerByEmail: (email: string) => Promise<CustomerLookup | null>;
  getSubscriptionsForUser: (userId: string) => Promise<CustomerLookup['subscriptions']>;

  createWebhook: (url: string, events: string[], secret?: string) => Promise<string>;
  deleteWebhook: (webhookId: string) => Promise<void>;

  dedupBackend: DedupBackend;

  healthCheck: () => Promise<HealthCheckResult>;
}
