export interface TestEnvConfig {
  isSandbox: boolean;
  apiKey: string;
  storeId: string;
  variantId?: string;
  orderId?: string;
  subscriptionId?: string;
  licenseKey?: string;
  discountId?: string;
  webhookId?: string;
  customerId?: string;
  orderItemId?: string;
}
