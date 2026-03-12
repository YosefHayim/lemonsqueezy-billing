import type { LicenseKeyEvent } from '../license/types.js';
import type { CustomerLookup } from '../cache/types.js';

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
