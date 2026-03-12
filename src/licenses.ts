import { getLicenseKey } from "@lemonsqueezy/lemonsqueezy.js";
import type { LicenseKeyManagement, LicenseKeyEvent, LemonSqueezyLicenseKeyAttributes } from "./types.js";
import { withRetry } from "./retry.js";

function mapAttributesToLicenseKeyEvent(
  attrs: LemonSqueezyLicenseKeyAttributes,
  licenseKeyId: string,
  key: string
): LicenseKeyEvent {
  return {
    userId: attrs.user_email,
    email: attrs.user_email,
    licenseKeyId,
    key,
    productId: String(attrs.product_id),
    variantId: String(attrs.order_item_id), // order_item_id relates to variant
    status: attrs.status,
    activationCount: attrs.instances_count,
    maxActivations: attrs.activation_limit,
  };
}

export function createLicenseKeyManagement(): LicenseKeyManagement {
  const validateLicense = async (key: string): Promise<{ valid: boolean; details?: LicenseKeyEvent }> => {
    try {
      const response = await withRetry(
        () => getLicenseKey(key),
        "getLicenseKey"
      );

      if (response.error) {
        return { valid: false };
      }

      if (!response.data?.data) {
        return { valid: false };
      }

      const attrs = response.data.data.attributes as LemonSqueezyLicenseKeyAttributes;
      const details = mapAttributesToLicenseKeyEvent(
        attrs,
        response.data.data.id,
        attrs.key
      );

      const valid = details.status === "active" && 
                   details.activationCount < details.maxActivations;

      return { valid, details };
    } catch {
      return { valid: false };
    }
  };

  const getLicenseDetails = async (key: string): Promise<LicenseKeyEvent | null> => {
    const response = await withRetry(
      () => getLicenseKey(key),
      "getLicenseKey"
    );

    if (response.error || !response.data?.data) {
      return null;
    }

    const attrs = response.data.data.attributes as LemonSqueezyLicenseKeyAttributes;
    return mapAttributesToLicenseKeyEvent(
      attrs,
      response.data.data.id,
      attrs.key
    );
  };

  const activateLicense = async (key: string, _instanceId?: string): Promise<boolean> => {
    // Note: Lemon Squeezy doesn't have a direct activation API
    // This would typically be handled by your application logic
    // based on the license key details and activation limits
    
    const validation = await validateLicense(key);
    if (!validation.valid || !validation.details) {
      return false;
    }

    // Here you would typically:
    // 1. Check if this instanceId is already activated
    // 2. Increment activation count in your database
    // 3. Return success/failure based on your business logic
    
    return true; // Placeholder - implement based on your needs
  };

  const deactivateLicense = async (_key: string, _instanceId?: string): Promise<boolean> => {
    // Similar to activateLicense, this would be handled by your application logic
    // based on your activation tracking system
    
    return true; // Placeholder - implement based on your needs
  };

  return {
    validateLicense,
    getLicenseDetails,
    activateLicense,
    deactivateLicense,
  };
}
