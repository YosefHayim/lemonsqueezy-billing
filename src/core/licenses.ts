import { getLicenseKey } from "@lemonsqueezy/lemonsqueezy.js";
import type {
  LicenseKeyManagement,
  LicenseKeyEvent,
  LemonSqueezyLicenseKeyAttributes,
  LicenseActivationResponse,
  LicenseDeactivationResponse,
} from "../types/index.js";
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

  const activateLicense = async (key: string, instanceId?: string): Promise<boolean> => {
    const instanceName = instanceId ?? "default";
    const body = new URLSearchParams({ license_key: key, instance_name: instanceName });

    try {
      const response = await fetch("https://api.lemonsqueezy.com/v1/licenses/activate", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      if (!response.ok) {
        return false;
      }

      const data = (await response.json()) as LicenseActivationResponse;
      return data.activated === true;
    } catch {
      return false;
    }
  };

  const deactivateLicense = async (key: string, instanceId?: string): Promise<boolean> => {
    const resolvedInstanceId = instanceId ?? "default";
    const body = new URLSearchParams({ license_key: key, instance_id: resolvedInstanceId });

    try {
      const response = await fetch("https://api.lemonsqueezy.com/v1/licenses/deactivate", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      if (!response.ok) {
        return false;
      }

      const data = (await response.json()) as LicenseDeactivationResponse;
      return data.deactivated === true;
    } catch {
      return false;
    }
  };

  return {
    validateLicense,
    getLicenseDetails,
    activateLicense,
    deactivateLicense,
  };
}
