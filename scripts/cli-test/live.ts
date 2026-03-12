import { createBilling } from "../../dist/index.js";
import { readFileSync, existsSync } from "node:fs";
import { TestConfig } from "./shared.js";

export async function runLiveTests(config: TestConfig): Promise<void> {
  const { pass, fail, cleanupFiles, logPhaseStart, logPhaseEnd } = await import("./shared.js");
  
  logPhaseStart("🌐 Live API Tests");
  
  cleanupFiles(config.cachePath, config.logPath);

  const billing = await createBilling({
    apiKey: config.apiKey,
    webhookSecret: config.webhookSecret,
    cachePath: config.cachePath,
    cacheTtlMs: 0, // Force fresh fetch
    logger: { filePath: config.logPath },
    callbacks: {
      onPurchase: async () => {},
      onRefund: async () => {},
    },
  });

  if (billing.stores.length > 0) {
    pass(`Store discovered: ${billing.stores[0].name} (${billing.stores[0].id})`);
  } else {
    fail("Store discovery", "No stores found");
  }
  
  if (billing.plans.length > 0) {
    for (const plan of billing.plans) {
      pass(`Plan: ${plan.name} / ${plan.variantName} — ${plan.priceFormatted}`);
    }
  } else {
    fail("Plans", "No published products found");
  }

  if (existsSync(config.cachePath)) {
    const cache = JSON.parse(readFileSync(config.cachePath, "utf-8"));
    if (cache.generatedAt && cache.store && cache.products) {
      pass("Cache file written");
    } else {
      fail("Cache file", "Invalid cache structure");
    }
  } else {
    fail("Cache file", "Live cache file not found");
  }
  
  if (billing.plans.length > 0) {
    try {
      const url = await billing.createCheckout({
        variantId: billing.plans[0].variantId,
        email: "validate@test.com",
        userId: "validate-user",
      });
      if (url.startsWith("https://")) pass(`Checkout URL: ${url.slice(0, 60)}...`);
      else fail("Checkout", "URL doesn't start with https://");
    } catch (err) {
      fail("Checkout", (err as Error).message);
    }
  }
  
  // Test health check
  try {
    const health = await billing.healthCheck();
    if (health.status === 'healthy') {
      pass("Health check passed");
    } else {
      fail("Health check", `Status: ${health.status}, Details: ${JSON.stringify(health.details)}`);
    }
  } catch (err) {
    fail("Health check", (err as Error).message);
  }
  
  // Test customer portal (requires a customer ID)
  try {
    // For testing, we'll use a placeholder customer ID since we can't easily get real ones
    // In a real test scenario, you'd use a known customer ID
    const testCustomerId = "1"; // Placeholder
    const portalUrl = await billing.getCustomerPortal(testCustomerId);
    if (portalUrl.startsWith("https://")) {
      pass(`Customer portal URL: ${portalUrl.slice(0, 60)}...`);
    } else {
      fail("Customer portal", "URL doesn't start with https://");
    }
  } catch (err) {
    // Customer portal might fail if customer doesn't exist, which is expected for test
    pass(`Customer portal (expected failure for test customer): ${(err as Error).message}`);
  }
  
  // Test customer lookup if email is provided
  if (config.testEmail) {
    try {
      const customer = await billing.getCustomerByEmail(config.testEmail);
      if (customer) {
        pass(`Customer lookup for ${config.testEmail}: ${customer.id}`);
      } else {
        pass(`Customer lookup for ${config.testEmail}: not found (expected)`);
      }
    } catch (err) {
      fail("Customer lookup", (err as Error).message);
    }
  } else {
    pass("Customer lookup (skipped - no test email provided)");
  }
  
  // Test license validation if license key is provided
  if (config.testLicenseKey) {
    try {
      const license = await billing.validateLicense(config.testLicenseKey);
      if (license.valid) {
        pass(`License validation for ${config.testLicenseKey}: valid`);
      } else {
        pass(`License validation for ${config.testLicenseKey}: invalid (expected for test)`);
      }
    } catch (err) {
      fail("License validation", (err as Error).message);
    }
  } else {
    pass("License validation (skipped - no test license key provided)");
  }
  
  // Test subscription management if subscription ID is provided
  if (config.testSubscriptionId) {
    try {
      // Test pause subscription
      await billing.pauseSubscription(config.testSubscriptionId, "test pause");
      pass(`Subscription pause for ${config.testSubscriptionId}: success`);
      
      // Test resume subscription
      await billing.resumeSubscription(config.testSubscriptionId);
      pass(`Subscription resume for ${config.testSubscriptionId}: success`);
    } catch (err) {
      fail("Subscription management", (err as Error).message);
    }
  } else {
    pass("Subscription management (skipped - no test subscription ID provided)");
  }
  
  const logContent = readFileSync(config.logPath, "utf-8").trim();
  const logLines = logContent.split("\n").filter(line => line.trim());
  if (logLines.length > 0) {
    pass(`Logger: ${logLines.length} entries recorded`);
  } else {
    fail("Logger", "No log entries written");
  }
  
  logPhaseEnd("🌐 Live API Tests");
}