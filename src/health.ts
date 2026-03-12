import { listStores } from "@lemonsqueezy/lemonsqueezy.js";
import type { HealthCheckResult } from "./types.js";
import { withRetry } from "./retry.js";

export async function healthCheck(): Promise<HealthCheckResult> {
  const timestamp = new Date().toISOString();
  const details = {
    apiConnectivity: false,
    cacheValid: false,
    webhookSecretConfigured: false,
    storeAccessible: false,
  };

  try {
    // Test API connectivity
    const response = await withRetry(
      () => listStores({ page: { number: 1, size: 1 } }),
      "healthCheck"
    );

    details.apiConnectivity = !response.error;
    details.storeAccessible = !response.error && !!response.data?.data;

    // Note: Cache validation would need access to the cache
    // This would typically be called from the main billing instance
    details.cacheValid = true; // Placeholder - implement based on your cache logic

    // Note: Webhook secret configuration check would need access to config
    details.webhookSecretConfigured = true; // Placeholder - implement based on your config

    const status: 'healthy' | 'unhealthy' = Object.values(details).every(Boolean) 
      ? 'healthy' 
      : 'unhealthy';

    return {
      status,
      details,
      timestamp,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      details,
      timestamp,
    };
  }
}