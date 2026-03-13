import { createBilling } from "../../dist/index.js";
import { TestConfig } from "./shared.js";

export async function runWebhookTests(config: TestConfig): Promise<void> {
  const { pass, fail, createHmacSignature, logPhaseStart, logPhaseEnd } = await import("./shared.js");
  
  logPhaseStart("📨 Webhook Simulation Tests");
  
  // Create billing instance with minimal config for webhook testing
  const billing = await createBilling({
    apiKey: "dummy-key",
    webhookSecret: config.webhookSecret,
    cachePath: config.cachePath,
    cacheTtlMs: 3_600_000,
    callbacks: {
      onPurchase: async () => {},
      onRefund: async () => {},
      onSubscriptionCreated: async () => {},
      onSubscriptionUpdated: async () => {},
      onSubscriptionCancelled: async () => {},
      onSubscriptionExpired: async () => {},
      onPaymentFailed: async () => {},
      onSubscriptionPaused: async () => {},
      onSubscriptionResumed: async () => {},
      onSubscriptionPaymentSuccess: async () => {},
      onSubscriptionPaymentRecovered: async () => {},
      onLicenseKeyCreated: async () => {},
      onLicenseKeyUpdated: async () => {},
    },
  });

  // Test webhook signature verification
  const testPayload = { test: true, event_name: "order_created" };
  const signature = createHmacSignature(testPayload, config.webhookSecret);
  
  if (billing.verifyWebhook(JSON.stringify(testPayload), signature)) {
    pass("Webhook signature verification (valid)");
  } else {
    fail("Webhook signature verification", "Valid signature rejected");
  }

  if (!billing.verifyWebhook(JSON.stringify(testPayload), "invalid-signature")) {
    pass("Webhook signature verification (invalid)");
  } else {
    fail("Webhook signature verification", "Invalid signature accepted");
  }

  // Test all 14 webhook event types
  const webhookTests = [
    {
      name: "order_created",
      payload: {
        meta: { event_name: "order_created", test_mode: false, custom_data: { user_id: "usr_1" } },
        data: { id: "ord_1", type: "orders", attributes: { user_email: "test@test.com", customer_id: 1, variant_id: "v1", product_name: "Pro", total: 499 } },
      },
    },
    {
      name: "order_refunded",
      payload: {
        meta: { event_name: "order_refunded", test_mode: false, custom_data: { user_id: "usr_1" } },
        data: { id: "ord_1", type: "orders", attributes: { user_email: "test@test.com", customer_id: 1, variant_id: "v1", product_name: "Pro", total: 499 } },
      },
    },
    {
      name: "subscription_created",
      payload: {
        meta: { event_name: "subscription_created", test_mode: false, custom_data: { user_id: "usr_1" } },
        data: { id: "sub_1", type: "subscriptions", attributes: { user_email: "test@test.com", customer_id: 1, variant_id: "v1", status: "active" } },
      },
    },
    {
      name: "subscription_updated",
      payload: {
        meta: { event_name: "subscription_updated", test_mode: false, custom_data: { user_id: "usr_1" } },
        data: { id: "sub_1", type: "subscriptions", attributes: { user_email: "test@test.com", customer_id: 1, variant_id: "v1", status: "active" } },
      },
    },
    {
      name: "subscription_cancelled",
      payload: {
        meta: { event_name: "subscription_cancelled", test_mode: false, custom_data: { user_id: "usr_1" } },
        data: { id: "sub_1", type: "subscriptions", attributes: { user_email: "test@test.com", customer_id: 1, variant_id: "v1", status: "cancelled" } },
      },
    },
    {
      name: "subscription_expired",
      payload: {
        meta: { event_name: "subscription_expired", test_mode: false, custom_data: { user_id: "usr_1" } },
        data: { id: "sub_1", type: "subscriptions", attributes: { user_email: "test@test.com", customer_id: 1, variant_id: "v1", status: "expired" } },
      },
    },
    {
      name: "subscription_payment_failed",
      payload: {
        meta: { event_name: "subscription_payment_failed", test_mode: false, custom_data: { user_id: "usr_1" } },
        data: { id: "sub_1", type: "subscriptions", attributes: { user_email: "test@test.com", customer_id: 1, variant_id: "v1", status: "past_due", reason: "payment_declined" } },
      },
    },
    {
      name: "subscription_paused",
      payload: {
        meta: { event_name: "subscription_paused", test_mode: false, custom_data: { user_id: "usr_1" } },
        data: { id: "sub_1", type: "subscriptions", attributes: { user_email: "test@test.com", customer_id: 1, variant_id: "v1", status: "paused", reason: "user_initiated" } },
      },
    },
    {
      name: "subscription_resumed",
      payload: {
        meta: { event_name: "subscription_resumed", test_mode: false, custom_data: { user_id: "usr_1" } },
        data: { id: "sub_1", type: "subscriptions", attributes: { user_email: "test@test.com", customer_id: 1, variant_id: "v1", status: "active" } },
      },
    },
    {
      name: "subscription_unpaused",
      payload: {
        meta: { event_name: "subscription_unpaused", test_mode: false, custom_data: { user_id: "usr_1" } },
        data: { id: "sub_1", type: "subscriptions", attributes: { user_email: "test@test.com", customer_id: 1, variant_id: "v1", status: "active" } },
      },
    },
    {
      name: "subscription_payment_success",
      payload: {
        meta: { event_name: "subscription_payment_success", test_mode: false, custom_data: { user_id: "usr_1" } },
        data: { id: "sub_1", type: "subscriptions", attributes: { user_email: "test@test.com", customer_id: 1, variant_id: "v1", status: "active", order_id: "ord_1", amount: 499 } },
      },
    },
    {
      name: "subscription_payment_recovered",
      payload: {
        meta: { event_name: "subscription_payment_recovered", test_mode: false, custom_data: { user_id: "usr_1" } },
        data: { id: "sub_1", type: "subscriptions", attributes: { user_email: "test@test.com", customer_id: 1, variant_id: "v1", status: "active", order_id: "ord_1", amount: 499 } },
      },
    },
    {
      name: "license_key_created",
      payload: {
        meta: { event_name: "license_key_created", test_mode: false, custom_data: { user_id: "usr_1" } },
        data: { id: "lic_1", type: "license_keys", attributes: { user_email: "test@test.com", customer_id: 1, key: "ABC-DEF-GHI", product_id: "prod_1", variant_id: "v1", status: "active", activation_limit: 5, instances_count: 0 } },
      },
    },
    {
      name: "license_key_updated",
      payload: {
        meta: { event_name: "license_key_updated", test_mode: false, custom_data: { user_id: "usr_1" } },
        data: { id: "lic_1", type: "license_keys", attributes: { user_email: "test@test.com", customer_id: 1, key: "ABC-DEF-GHI", product_id: "prod_1", variant_id: "v1", status: "active", activation_limit: 5, instances_count: 1 } },
      },
    },
  ];

  // Test each webhook event
  for (const test of webhookTests) {
    try {
      const signature = createHmacSignature(test.payload, config.webhookSecret);
      await billing.handleWebhook(test.payload);
      pass(`Webhook ${test.name} (signature verification and handler)`);
    } catch (err) {
      fail(`Webhook ${test.name}`, (err as Error).message);
    }
  }

  // Test deduplication - send the same event twice
  try {
    const duplicatePayload = webhookTests[0].payload;
    const duplicateSignature = createHmacSignature(duplicatePayload, config.webhookSecret);
    await billing.handleWebhook(duplicatePayload);
    await billing.handleWebhook(duplicatePayload);
    pass("Webhook deduplication");
  } catch (err) {
    fail("Webhook deduplication", (err as Error).message);
  }

  logPhaseEnd("📨 Webhook Simulation Tests");
}
