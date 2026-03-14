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
  webhookUrl?: string;
  customerId?: string;
  orderItemId?: string;
}
