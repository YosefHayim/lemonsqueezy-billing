import { getLicenseKey, listLicenseKeys, getLicenseKeyInstance, listLicenseKeyInstances, updateLicenseKey } from "@lemonsqueezy/lemonsqueezy.js";
import type {
  LicenseKeyManagement,
  LicenseKeyEvent,
  LemonSqueezyLicenseKeyAttributes,
  LicenseActivationResponse,
  LicenseDeactivationResponse,
} from "../types/index.js";
import { withRetry } from "./retry.js";

const LS_LICENSE_API_BASE = "https://api.lemonsqueezy.com/v1/licenses";

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
                   (details.maxActivations === null || details.activationCount <= details.maxActivations);

      return { valid, details };
    } catch {
      return { valid: false };
    }
  };

  const getLicenseDetails = async (key: string): Promise<LicenseKeyEvent | null> => {
    try {
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
    } catch {
      return null;
    }
  };

  // Note: License API is a direct HTTP call; retries are intentionally omitted (callers should retry at the application level)
  const activateLicense = async (key: string, instanceName?: string): Promise<{ activated: boolean; instanceId?: string }> => {
    const resolvedName = instanceName ?? "default";
    const body = new URLSearchParams({ license_key: key, instance_name: resolvedName });

    try {
      const response = await fetch(`${LS_LICENSE_API_BASE}/activate`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      if (!response.ok) {
        return { activated: false };
      }

      const data = (await response.json()) as LicenseActivationResponse;
      return { activated: data.activated === true, instanceId: data.instance?.id };
    } catch {
      return { activated: false };
    }
  };

  const deactivateLicense = async (key: string, instanceId?: string): Promise<boolean> => {
    if (!instanceId) {
      return false;
    }
    const body = new URLSearchParams({ license_key: key, instance_id: instanceId });

    try {
      const response = await fetch(`${LS_LICENSE_API_BASE}/deactivate`, {
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

    listLicenseKeys: async (filter = {}) => {
      const response = await withRetry(() => listLicenseKeys({ filter }), "listLicenseKeys");
      if (response.error) throw new Error(`Failed to list license keys: ${response.error.message}`);
      return (response.data?.data ?? []).map((k: any) => ({ id: k.id, ...k.attributes }));
    },

    getLicenseKeyInstance: async (instanceId: string) => {
      const response = await withRetry(() => getLicenseKeyInstance(instanceId), "getLicenseKeyInstance");
      if (response.error) throw new Error(`Failed to get license key instance: ${response.error.message}`);
      return response.data?.data?.attributes ?? null;
    },

    listLicenseKeyInstances: async (licenseKeyId?: string) => {
      const response = await withRetry(() => listLicenseKeyInstances({ filter: { licenseKeyId } }), "listLicenseKeyInstances");
      if (response.error) throw new Error(`Failed to list license key instances: ${response.error.message}`);
      return (response.data?.data ?? []).map((i: any) => ({ id: i.id, ...i.attributes }));
    },

    updateLicenseKey: async (licenseKeyId: string, params: { disabled?: boolean; activationLimit?: number }) => {
      const response = await withRetry(() => updateLicenseKey(licenseKeyId, params), "updateLicenseKey");
      if (response.error) throw new Error(`Failed to update license key: ${response.error.message}`);
    },
  };
}
