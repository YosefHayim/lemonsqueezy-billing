export interface BillingLogger {
  info: (entry: Record<string, unknown>) => void;
  warn: (entry: Record<string, unknown>) => void;
  error: (entry: Record<string, unknown>) => void;
}

export type LoggerConfig =
  | { filePath: string; custom?: never }
  | { custom: BillingLogger; filePath?: never };

export type LogLevel = 'minimal' | 'standard' | 'detailed' | 'debug';

export interface EnhancedLoggerConfig {
  logLevel?: LogLevel;
  includeRequestResponse?: boolean;
  includeHeaders?: boolean;
  includeBody?: boolean;
  includeQueryParams?: boolean;
  includeResponseTime?: boolean;
  includeStackTrace?: boolean;
}

export type BillingLoggerConfig = 
  | LoggerConfig 
  | (LoggerConfig & EnhancedLoggerConfig);

export interface DedupBackend {
  isDuplicate: (key: string) => Promise<boolean>;
  markDuplicate: (key: string, ttlMs: number) => Promise<void>;
}

export interface DedupConfig {
  backend?: DedupBackend;
  ttlMs?: number;
}

export interface BillingConfig {
  apiKey: string;
  storeId?: string;
  webhookSecret?: string;
  cachePath?: string;
  cacheTtlMs?: number;
  checkoutExpiresInMs?: number | null;
  logger?: BillingLoggerConfig;
  callbacks: {
    onPurchase: (event: {
      userId: string;
      email: string;
      orderId: string;
      customerId: string;
      variantId: string;
      productName: string;
      price: number;
    }) => Promise<void>;
    onRefund?: (event: { userId: string; email: string; orderId: string }) => Promise<void>;
    onSubscriptionCreated?: (event: { userId: string; email: string; subscriptionId: string; customerId: string; variantId: string; status: string }) => Promise<void>;
    onSubscriptionUpdated?: (event: { userId: string; email: string; subscriptionId: string; customerId: string; variantId: string; status: string }) => Promise<void>;
    onSubscriptionCancelled?: (event: { userId: string; email: string; subscriptionId: string; customerId: string; variantId: string; status: string }) => Promise<void>;
    onSubscriptionExpired?: (event: { userId: string; email: string; subscriptionId: string; customerId: string; variantId: string; status: string }) => Promise<void>;
    onPaymentFailed?: (event: { userId: string; email: string; subscriptionId: string; customerId: string; reason: string }) => Promise<void>;
    onSubscriptionPaused?: (event: { userId: string; email: string; subscriptionId: string; customerId: string; reason?: string }) => Promise<void>;
    onSubscriptionResumed?: (event: { userId: string; email: string; subscriptionId: string; customerId: string }) => Promise<void>;
    onSubscriptionPaymentSuccess?: (event: { userId: string; email: string; subscriptionId: string; customerId: string; orderId: string; amount: number }) => Promise<void>;
    onSubscriptionPaymentRecovered?: (event: { userId: string; email: string; subscriptionId: string; customerId: string; orderId: string; amount: number }) => Promise<void>;
    onLicenseKey?: (method: 'created' | 'updated', event: { userId: string; email: string; licenseKeyId: string; key: string; productId: string; variantId: string; status: string; activationCount: number; maxActivations: number }) => Promise<void>;
    onWebhook?: (eventType: string, event: unknown) => Promise<void>;
  };
  dedup?: DedupConfig;
}
