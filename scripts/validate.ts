import { createBilling } from "../dist/src/core/index.js";
import { createHmac } from "node:crypto";
import { readFileSync, unlinkSync, existsSync } from "node:fs";

const API_KEY = process.env.LS_API_KEY;
const WEBHOOK_SECRET = process.env.LS_WEBHOOK_SECRET ?? "test-webhook-secret";
const CACHE_PATH = "/tmp/lemonsqueezy-billing-validate-cache.json";
const LOG_PATH = "/tmp/lemonsqueezy-billing-validate.log";

function pass(label: string) { console.log(`  ✅ ${label}`); }
function fail(label: string, error: string) { console.log(`  ❌ ${label}: ${error}`); }

function cleanup() {
  try { unlinkSync(CACHE_PATH); } catch {}
  try { unlinkSync(LOG_PATH); } catch {}
}

async function validateOffline() {
  console.log("\n📦 Offline Validation (no API key needed)\n");

  const { readCache, writeCache, isCacheValid } = await import("../dist/src/core/cache.js");
  const { createWebhookVerifier, createWebhookHandler } = await import("../dist/src/core/webhook.js");
  const { createLogger, withLogger } = await import("../dist/src/core/logger.js");
  const { withRetry } = await import("../dist/src/core/retry.js");

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

  writeCache(testCache, CACHE_PATH);
  const loaded = readCache(CACHE_PATH);
  if (loaded?.store.name === "Test Store") pass("Cache write + read");
  else fail("Cache write + read", "Data mismatch");
  if (isCacheValid(loaded, 3_600_000)) pass("Cache TTL (fresh)");
  else fail("Cache TTL", "Fresh cache rejected");
  const oldCache = { ...testCache, generatedAt: new Date(Date.now() - 7_200_000).toISOString() };
  writeCache(oldCache, CACHE_PATH);
  if (!isCacheValid(readCache(CACHE_PATH), 3_600_000)) pass("Cache TTL (expired rejected)");
  else fail("Cache TTL", "Expired cache accepted");
  const verifier = createWebhookVerifier(WEBHOOK_SECRET);
  const body = '{"test":true}';
  const validSig = createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");
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

  const logger = createLogger({ filePath: LOG_PATH });
  if (logger) pass("File logger created");
  else fail("File logger", "createLogger returned undefined");
  if (logger) {
    const wrapped = withLogger(logger, "testOp", async (args: Record<string, unknown>) => ({ ok: true }));
    await wrapped({ email: "secret@test.com", apiKey: "ls_live_abcdef123456" });
    const logContent = readFileSync(LOG_PATH, "utf-8").trim();
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

  writeCache(testCache, CACHE_PATH);
  const billing = await createBilling({
    apiKey: "dummy-key-cache-hit",
    storeId: "test-store",
    webhookSecret: WEBHOOK_SECRET,
    cachePath: CACHE_PATH,
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

async function validateLive() {
  if (!API_KEY) {
    console.log("\n\ud83c\udf10 Live Validation\n");
    console.log("  \u23ed\ufe0f  Skipped \u2014 set LS_API_KEY env var to run live tests");
    return;
  }
  console.log("\n\ud83c\udf10 Live Validation (real API calls)\n");
  cleanup();

  // Force fresh cache by using a different cache path for live tests
  const liveCachePath = "/tmp/lemonsqueezy-billing-live-cache.json";
  
  const billing = await createBilling({
    apiKey: API_KEY,
    webhookSecret: WEBHOOK_SECRET,
    cachePath: liveCachePath,  // Use different cache path for live tests
    cacheTtlMs: 0,  // Force fresh fetch
    logger: { filePath: LOG_PATH },
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
      pass(`Plan: ${plan.name} / ${plan.variantName} \u2014 ${plan.priceFormatted}`);
    }
  } else {
    fail("Plans", "No published products found");
  }

  if (existsSync(liveCachePath)) {
    const cache = JSON.parse(readFileSync(liveCachePath, "utf-8"));
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
  const logContent = readFileSync(LOG_PATH, "utf-8").trim();
  const logLines = logContent.split("\n").filter(line => line.trim());
  if (logLines.length > 0) {
    pass(`Logger: ${logLines.length} entries recorded`);
  } else {
    fail("Logger", "No log entries written");
  }
  cleanup();
}

async function main() {
  console.log("\ud83c\udf4b lemonsqueezy-billing \u2014 Validation Suite\n");
  console.log("=".repeat(50));
  await validateOffline();
  await validateLive();
  console.log("\n" + "=".repeat(50));
  console.log("\n\u2728 Validation complete\n");
  
  // Show where files were saved for inspection
  console.log('\n📁 Validation files location:');
  console.log(`   Cache file: ${CACHE_PATH}`);
  console.log(`   Log file: ${LOG_PATH}`);
}

main().catch((err) => {
  console.error("\n\ud83d\udca5 Validation crashed:", (err as Error).message);
  cleanup();
  process.exit(1);
});
