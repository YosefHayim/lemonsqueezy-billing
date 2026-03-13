export type LicenseMethod = 'created' | 'updated';

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

export interface LicenseActivationResponse {
  activated: boolean;
  error: string | null;
  instance?: { id: string; name: string };
}

export interface LicenseDeactivationResponse {
  deactivated: boolean;
  error: string | null;
}

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
