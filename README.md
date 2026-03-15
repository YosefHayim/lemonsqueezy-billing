# fresh-squeezy

> The missing billing layer for Lemon Squeezy — one function call to handle checkout, webhooks, subscriptions, and licenses.

[![npm](https://img.shields.io/npm/v/fresh-squeezy)](https://www.npmjs.com/package/fresh-squeezy)
[![npm downloads](https://img.shields.io/npm/dm/fresh-squeezy)](https://www.npmjs.com/package/fresh-squeezy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Install

```bash
npm install fresh-squeezy @lemonsqueezy/lemonsqueezy.js
```

---

## Quick Start

```typescript
import { createBilling } from "fresh-squeezy";

const billing = await createBilling({
  apiKey: process.env.LS_API_KEY!,
  webhookSecret: process.env.LS_WEBHOOK_SECRET!,
  callbacks: {
    onOrder: async (event, method) => {
      if (method === 'purchase') await db.grantAccess(event.userId);
      if (method === 'refund')   await db.revokeAccess(event.userId);
    },
    onSubscription: async (event, method) => {
      if (method === 'created')          await db.startSubscription(event.userId);
      if (method === 'cancelled')        await db.cancelSubscription(event.userId);
      if (method === 'payment_success')  await db.extendAccess(event.userId, event.amount);
      if (method === 'payment_failed')   await notifications.sendPaymentFailed(event.email);
    },
    onLicenseKey: async (event, method) => {
      if (method === 'created') await db.storeLicense(event.userId, event.key);
    },
  },
});

// Checkout URL
const url = await billing.createCheckout({
  variantId: billing.plans[0].variantId,
  email: "user@example.com",
  userId: "user_abc",
});

// Webhook endpoint (Express)
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  if (!billing.verifyWebhook(req.body.toString(), req.headers["x-signature"] as string))
    return res.sendStatus(401);
  await billing.handleWebhook(JSON.parse(req.body.toString()));
  res.json({ ok: true });
});
```

---

## Setup Wizard

The fastest way to get started — auto-discovers your stores and products, generates ready-to-run config files, and optionally runs API lifecycle validation tests:

```bash
npx fresh-squeezy-billing wizard
```

Generates `.billing/billing-config.ts` and `.billing/example.ts`. Previous answers are cached to `.billing/wizard-cache.json` for fast re-runs.

> Built with [grimoire-wizard](https://github.com/YosefHayim/grimoire) — config-driven CLI wizard framework.

---

## Configuration

```typescript
interface BillingConfig {
  apiKey: string;
  webhookSecret?: string;
  storeId?: string;
  cachePath?: string;             // default: ".billing/cache.json"
  cacheTtlMs?: number;            // default: 3_600_000 (1 hour)
  checkoutExpiresInMs?: number;
  logger?: { filePath: string };
  callbacks: BillingCallbacks;
  dedup?: DedupConfig;
}
```

---

## Callbacks

4 callbacks, all using the same `(event, method)` pattern:

```typescript
interface BillingCallbacks {
  // required — handles purchase and refund
  onOrder: (event: OrderEvent, method: 'purchase' | 'refund') => Promise<void>;

  // optional — all subscription lifecycle + payment events
  onSubscription?: (event: SubscriptionEvent, method: SubscriptionMethod) => Promise<void>;

  // optional — license key created or updated
  onLicenseKey?: (event: LicenseKeyEvent, method: 'created' | 'updated') => Promise<void>;

  // optional — catch-all for every raw webhook event
  onWebhook?: (eventType: string, event: WebhookEvent) => Promise<void>;
}

type SubscriptionMethod =
  | 'created' | 'updated' | 'cancelled' | 'expired'   // lifecycle
  | 'paused'  | 'resumed'                              // pausing
  | 'payment_success' | 'payment_recovered' | 'payment_failed'; // payments
```

---

## API Reference

### Core
```typescript
billing.stores                                  // StoreInfo[]
billing.plans                                   // Plan[]
billing.createCheckout(params)                  // → checkout URL
billing.verifyWebhook(rawBody, signature)       // → boolean
billing.handleWebhook(payload)                  // dispatches to callbacks
billing.refreshPlans()                          // refresh cached plans
billing.getCustomerPortal(customerId)           // → portal URL
billing.getExpressRouter(options)               // Express Router
billing.healthCheck()                           // → HealthCheckResult
```

### Stores & Auth
```typescript
billing.getStore(storeId)                       // → store details
billing.listStores()                            // → all stores
billing.getAuthenticatedUser()                  // → API key owner
```

### Subscriptions
```typescript
billing.getSubscription(id)
billing.listSubscriptions(filter?)
billing.pauseSubscription(id, reason?)
billing.resumeSubscription(id)
billing.cancelSubscription(id, immediately?)
billing.changeSubscriptionVariant(id, variantId)
billing.resumeCancelledSubscription(id)

// Invoices
billing.getSubscriptionInvoice(invoiceId)
billing.listSubscriptionInvoices(filter?)
billing.generateSubscriptionInvoice(invoiceId)
billing.issueSubscriptionInvoiceRefund(invoiceId, amount)

// Metered billing
billing.getSubscriptionItem(itemId)
billing.listSubscriptionItems(subscriptionId?)
billing.getSubscriptionItemCurrentUsage(itemId)
billing.createUsageRecord(subscriptionItemId, quantity, action?)
billing.listUsageRecords(subscriptionItemId?)
```

### Orders
```typescript
billing.getOrder(orderId)
billing.listOrders(filter?)                     // filter: { storeId?, userEmail? }
billing.generateOrderInvoice(orderId)
billing.issueOrderRefund(orderId, amount)
billing.getOrderItem(orderItemId)
billing.listOrderItems(filter?)
```

### Customers
```typescript
billing.getCustomer(customerId)
billing.getCustomerByEmail(email)
billing.createCustomer(storeId, name, email)
billing.updateCustomer(customerId, params)      // { name?, email? }
billing.archiveCustomer(customerId)
billing.getSubscriptionsForUser(userId)
```

### Licenses
```typescript
billing.validateLicense(key)                    // → { valid, details? }
billing.getLicenseDetails(key)                  // → LicenseKeyEvent | null
billing.activateLicense(key, instanceName?)     // → { activated, instanceId? }
billing.deactivateLicense(key, instanceId)      // → boolean
billing.listLicenseKeys(filter?)
billing.getLicenseKeyInstance(instanceId)
billing.listLicenseKeyInstances(licenseKeyId?)
billing.updateLicenseKey(licenseKeyId, params)  // { disabled?, activationLimit? }
```

### Webhooks
```typescript
billing.listWebhooks()                          // → [{ id, url, events, createdAt }]
billing.getWebhook(webhookId)                   // → { id, url, events, createdAt } | null
billing.createWebhook(url, events, secret?)     // → webhook ID
billing.updateWebhook(webhookId, url?, events?) // → void
billing.deleteWebhook(webhookId)                // → void
```

### Catalog
```typescript
billing.getProduct(productId)
billing.listProducts(storeId?)
billing.getVariant(variantId)
billing.listVariants(productId?)
billing.getPrice(priceId)
billing.listPrices(variantId?)
billing.getFile(fileId)
billing.listFiles(variantId?)
```

### Discounts
```typescript
billing.createDiscount(storeId, params)         // params: { name, code, amount, amountType?, expiresAt? }
billing.deleteDiscount(discountId)
billing.getDiscount(discountId)
billing.listDiscounts(storeId?)
billing.getDiscountRedemption(redemptionId)
billing.listDiscountRedemptions(discountId?)
```

### Checkouts
```typescript
billing.createCheckout(params)                  // → URL string
billing.getCheckout(checkoutId)
billing.listCheckouts(storeId?, variantId?)
```

---

## Express Router

Drop-in router for `/plans` and `/checkout` endpoints:

```typescript
app.use("/billing", billing.getExpressRouter({
  getUserId:    (req) => req.user.id,
  getUserEmail: (req) => req.user.email,
}));
// GET  /billing/plans      → returns billing.plans
// POST /billing/checkout   → returns { url }
// POST /billing/webhook    → handles + verifies webhook
```

---

## Deduplication

Webhook deduplication is in-memory by default. Swap to Redis or DB for multi-instance:

```typescript
import { RedisDedupBackend } from "fresh-squeezy";

const billing = await createBilling({
  ...config,
  dedup: { backend: new RedisDedupBackend(redisClient), ttlMs: 86_400_000 },
});
```

---

## CLI

```bash
npx fresh-squeezy-billing wizard     # interactive setup wizard
npx fresh-squeezy-billing validate   # smoke-test your config
npx fresh-squeezy-billing help
```

---

## Paste to your AI assistant

Copy the block below and paste it into Claude, ChatGPT, or any LLM to get instant help integrating fresh-squeezy into your project:

```
I'm integrating the npm package "fresh-squeezy" (Lemon Squeezy billing layer) into my project.

Package: fresh-squeezy
Install: npm install fresh-squeezy @lemonsqueezy/lemonsqueezy.js

The main API:

  import { createBilling } from "fresh-squeezy";

  const billing = await createBilling({
    apiKey: process.env.LS_API_KEY,
    webhookSecret: process.env.LS_WEBHOOK_SECRET,
    callbacks: {
      onOrder: async (event, method) => {
        // method: 'purchase' | 'refund'
        // event: { userId, email, orderId, customerId?, variantId?, productName?, price? }
      },
      onSubscription: async (event, method) => {
        // method: 'created'|'updated'|'cancelled'|'expired'|'paused'|'resumed'
        //       | 'payment_success'|'payment_recovered'|'payment_failed'
        // event: { userId, email, subscriptionId, customerId, variantId, status, ... }
      },
      onLicenseKey: async (event, method) => {
        // method: 'created' | 'updated'
        // event: { userId, email, key, licenseKeyId, productId, variantId, status }
      },
    },
  });

  billing.plans           // available plans/variants
  billing.stores          // store info
  billing.createCheckout({ variantId, email, userId })  // → checkout URL
  billing.verifyWebhook(rawBody, signature)             // → boolean
  billing.handleWebhook(payload)                        // dispatches to callbacks
  billing.getCustomerPortal(customerId)                 // → portal URL

  // Management (all return typed data)
  billing.listWebhooks()
  billing.getSubscription(id) / listSubscriptions(filter?)
  billing.listOrders(filter?) / getOrder(id) / issueOrderRefund(id, amount)
  billing.getCustomer(id) / createCustomer(storeId, name, email)
  billing.validateLicense(key) / activateLicense(key, instanceName)
  billing.listProducts(storeId?) / listVariants(productId?)
  billing.createDiscount(storeId, { name, code, amount })

Webhook endpoint pattern (Express):
  app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    if (!billing.verifyWebhook(req.body.toString(), req.headers["x-signature"])) return res.sendStatus(401);
    await billing.handleWebhook(JSON.parse(req.body.toString()));
    res.json({ ok: true });
  });

Help me [describe what you need help with].
```

---

## Requirements

- Node.js >= 20
- `@lemonsqueezy/lemonsqueezy.js` >= 3.2.0 (peer dep)
- Express >= 4.18 (optional — only for `getExpressRouter`)

## License

MIT
