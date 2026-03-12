import { createBilling } from "../../dist/index.js";
import { createHmac } from "node:crypto";
import { readFileSync, unlinkSync, existsSync } from "node:fs";
import { TestConfig } from "./shared.js";

export async function runOfflineTests(config: TestConfig): Promise<void> {
  const { pass, fail, cleanupFiles } = await import("./shared.js");
  
  cleanupFiles(config.cachePath, config.logPath);

  const { readCache, writeCache, isCacheValid } = await import("../../dist/cache.js");
  const { createWebhookVerifier, createWebhookHandler } = await import("../../dist/webhook.js");
  const { createLogger, withLogger } = await import("../../dist/logger.js");
  const { withRetry } = await import("../../dist/retry.js");

  const testCache = {
    generatedAt: new Date().toISOString(),
    store: { id: "test-store", name: "Test Store", slug: "test", currency: "USD" },
    products: [{
      id: "prod-1",
      name: "Test Product",
      description: "Test",
      status: "published",
      variants: [{
        id: "var-1",
        name: "Default",
        price: 499,
        priceFormatted: "$4.99",
        isSubscription: false,
        status: "published",
      }],
    }],
  };

  writeCache(testCache, config.cachePath);
  const loaded = readCache(config.cachePath);
  if (loaded?.store.name === "Test Store") pass("Cache write + read");
  else fail("Cache write + read", "Data mismatch");
  
  if (isCacheValid(loaded, 3_600_000)) pass("Cache TTL (fresh)");
  else fail("Cache TTL", "Fresh cache rejected");
  
  const oldCache = { ...testCache, generatedAt: new Date(Date.now() - 7_200_000).toISOString() };
  writeCache(oldCache, config.cachePath);
  if (!isCacheValid(readCache(config.cachePath), 3_600_000)) pass("Cache TTL (expired rejected)");
  else fail("Cache TTL", "Expired cache accepted");

  const verifier = createWebhookVerifier(config.webhookSecret);
  const body = '{"test":true}';
  const validSig = createHmac("sha256", config.webhookSecret).update(body).digest("hex");
  
  if (verifier(body, validSig)) pass("Webhook signature (valid accepted)");
  else fail("Webhook signature", "Valid sig rejected");
  
  if (!verifier(body, "invalid-signature")) pass("Webhook signature (invalid rejected)");
  else fail("Webhook signature", "Invalid sig accepted");
  
  if (!verifier(body + "tampered", validSig)) pass("Webhook signature (tampered rejected)");
  else fail("Webhook signature", "Tampered body accepted");

  let purchaseCount = 0;
  const handler = createWebhookHandler({
    onPurchase: async () => { purchaseCount++; },
  });
  
  const orderPayload = {
    meta: { event_name: "order_created", test_mode: false, custom_data: { user_id: "usr_1" } },
    data: { id: "ord_1", type: "orders", attributes: { user_email: "test@test.com", customer_id: 1, variant_id: "v1", product_name: "Pro", total: 499 } },
  };
  
  await handler(orderPayload);
  if (purchaseCount === 1) pass("Webhook dispatch (order_created)");
  else fail("Webhook dispatch", `Expected 1 call, got ${purchaseCount}`);
  
  const dup = await handler(orderPayload);
  if (dup.skipped && purchaseCount === 1) pass("Webhook deduplication");
  else fail("Webhook dedup", "Duplicate not skipped");

  const logger = createLogger({ filePath: config.logPath });
  if (logger) pass("File logger created");
  else fail("File logger", "createLogger returned undefined");
  
  if (logger) {
    const wrapped = withLogger(logger, "testOp", async (args: Record<string, unknown>) => ({ ok: true }));
    await wrapped({ email: "secret@test.com", apiKey: "ls_live_abcdef123456" });
    const logContent = readFileSync(config.logPath, "utf-8").trim();
    const logLines = logContent.split("\n").filter(line => line.trim());
    if (logLines.length > 0) {
      try {
        const entry = JSON.parse(logLines[0]);
        if (entry.op === "testOp" && entry.input.email.includes("*") && entry.input.apiKey.includes("...")) {
          pass("Logger masking (email + apiKey)");
        } else {
          fail("Logger masking", "Sensitive fields not masked");
        }
      } catch (err) {
        fail("Logger masking", "Failed to parse log entry");
      }
    } else {
      fail("Logger masking", "No log entries found");
    }
  }

  let retryAttempts = 0;
  try {
    await withRetry(async () => {
      retryAttempts++;
      const err = new Error("client error") as Error & { status: number };
      err.status = 422;
      throw err;
    }, "retryTest", 3);
  } catch {}
  if (retryAttempts === 1) pass("Retry (4xx not retried)");
  else fail("Retry", `Expected 1 attempt, got ${retryAttempts}`);

  writeCache(testCache, config.cachePath);
  const billing = await createBilling({
    apiKey: "dummy-key-cache-hit",
    storeId: "test-store",
    webhookSecret: config.webhookSecret,
    cachePath: config.cachePath,
    cacheTtlMs: 3_600_000,
    callbacks: { onPurchase: async () => {} },
  });
  
  if (billing.stores.length > 0 && billing.plans.length === 1 && billing.plans[0].price === 499) {
    pass("createBilling from cache");
  } else {
    fail("createBilling from cache", "Unexpected plans/stores");
  }
  
  if (billing.verifyWebhook(body, validSig)) pass("billing.verifyWebhook");
  else fail("billing.verifyWebhook", "Valid sig rejected");
}