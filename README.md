# 🍋 lemonsqueezy-billing

**The missing billing layer for Lemon Squeezy. Auto-discover, checkout, webhooks — one function.**

[![npm version](https://img.shields.io/npm/v/@yosefhayim/lemonsqueezy-billing)](https://www.npmjs.com/package/@yosefhayim/lemonsqueezy-billing)
[![npm downloads](https://img.shields.io/npm/dm/@yosefhayim/lemonsqueezy-billing)](https://www.npmjs.com/package/@yosefhayim/lemonsqueezy-billing)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)

> [!WARNING]
> This is an **unofficial** community package. It is not affiliated with, endorsed by, or supported by Lemon Squeezy. Use at your own risk in production.

---

## Why?

The raw Lemon Squeezy SDK gives you API primitives. Every project still needs the same wiring: discover your store and products, build checkout sessions with retry logic, verify webhook signatures, deduplicate events, and dispatch to the right handler. This package does all of that in a single `createBilling()` call so you can ship billing in an afternoon instead of a week.

---

## Features

- 🔍 **Auto-Discovery** — finds your stores, products, and variants automatically
- 💰 **Checkout Sessions** — per-user URLs with retry, expiry, and error surfacing
- 🔐 **Webhook Handling** — HMAC verification, deduplication, 7 event types
- 📝 **Structured Logging** — NDJSON file logger or bring-your-own
- 🚀 **Express Router** — optional drop-in router with automatic raw body middleware
- 💾 **Smart Cache** — `billing-cache.json` as readable source of truth
- 🔄 **Retry with Backoff** — exponential backoff on 429/5xx responses
- 📦 **Zero Config** — pass API key, get everything. No manual product ID wiring

---

## Install

```bash
# pnpm
pnpm add @yosefhayim/lemonsqueezy-billing @lemonsqueezy/lemonsqueezy.js

# npm
npm install @yosefhayim/lemonsqueezy-billing @lemonsqueezy/lemonsqueezy.js

# yarn
yarn add @yosefhayim/lemonsqueezy-billing @lemonsqueezy/lemonsqueezy.js
```

If you want the Express router, also install Express:

```bash
pnpm add express
```

---

## Quick Start

```ts
import { createBilling } from "@yosefhayim/lemonsqueezy-billing";

const billing = await createBilling({
  apiKey: process.env.LS_API_KEY!,
  webhookSecret: process.env.LS_WEBHOOK_SECRET,
  logger: { filePath: "./logs/billing.log" },
  callbacks: {
    onPurchase: async (event) => {
      await db.users.update(event.userId, { plan: "pro", orderId: event.orderId });
    },
    onRefund: async (event) => {
      await db.users.update(event.userId, { plan: "free" });
    },
  },
});

// Auto-discovered from your Lemon Squeezy store
console.log(billing.stores);  // [{ id: "270009", name: "My Store", ... }]
console.log(billing.plans);   // [{ variantId: "abc", name: "Pro", price: 499, ... }]

// Create per-user checkout URL
const checkoutUrl = await billing.createCheckout({
  variantId: billing.plans[0].variantId,
  email: user.email,
  userId: user.id,
});
```

That's it. No manual store ID lookup, no product ID wiring, no webhook boilerplate.

---

## API Reference

### `createBilling(config)`

The factory function. Call once at startup — it hits the Lemon Squeezy API, caches your store and products, and returns a `Billing` object.

```ts
const billing = await createBilling({
  apiKey: string,           // required — your LS API key
  webhookSecret?: string,   // required for webhook verification
  storeId?: string,         // optional — defaults to your first store
  cachePath?: string,       // optional — defaults to ./billing-cache.json
  cacheTtlMs?: number,      // optional — cache TTL in ms, defaults to 1 hour
  checkoutExpiresInMs?: number | null, // optional — checkout link expiry, defaults to 24h. null = no expiry
  logger?: LoggerConfig,    // optional — see Logger section
  callbacks: BillingCallbacks, // required — event handlers
});
```

**`BillingCallbacks`**

```ts
{
  onPurchase: (event: PurchaseEvent) => Promise<void>;           // required
  onRefund?: (event: RefundEvent) => Promise<void>;
  onSubscriptionCreated?: (event: SubscriptionEvent) => Promise<void>;
  onSubscriptionUpdated?: (event: SubscriptionEvent) => Promise<void>;
  onSubscriptionCancelled?: (event: SubscriptionEvent) => Promise<void>;
  onSubscriptionExpired?: (event: SubscriptionEvent) => Promise<void>;
  onPaymentFailed?: (event: PaymentFailedEvent) => Promise<void>;
}
```

---

### `billing.stores`

```ts
billing.stores: StoreInfo[]
```

Array of stores discovered from your API key. Each entry:

```ts
{
  id: string;
  name: string;
  slug: string;
  currency: string;
}
```

---

### `billing.plans`

```ts
billing.plans: Plan[]
```

Flat list of all published variants across all products in your store. Each entry:

```ts
{
  id: string;           // product ID
  variantId: string;    // use this for createCheckout
  productId: string;
  name: string;         // product name
  variantName: string;
  price: number;        // in cents
  priceFormatted: string; // e.g. "$4.99"
  currency: string;
  isSubscription: boolean;
  status: string;
}
```

---

### `billing.createCheckout(params)`

Creates a per-user checkout URL. Retries on 429/5xx with exponential backoff. The URL expires after 24 hours by default (configurable via `checkoutExpiresInMs`).

```ts
const url = await billing.createCheckout({
  variantId: string,  // from billing.plans[n].variantId
  email: string,      // pre-fills the checkout form
  userId: string,     // passed as custom_data.user_id — comes back in webhook events
});
// returns: "https://your-store.lemonsqueezy.com/checkout/..."
```

The `userId` is embedded in the checkout as `custom_data.user_id`. When the webhook fires, `event.userId` will be this value — no database lookup needed to know who bought.

---

### `billing.verifyWebhook(rawBody, signature)`

Verifies an incoming webhook using HMAC-SHA256. Requires `webhookSecret` in config.

```ts
const isValid: boolean = billing.verifyWebhook(
  rawBody,    // string — the raw request body (before JSON.parse)
  signature   // string — value of the X-Signature header
);
```

> [!IMPORTANT]
> Always verify before calling `handleWebhook`. The Express router does this automatically.

---

### `billing.handleWebhook(payload)`

Dispatches a verified webhook payload to the appropriate callback. Deduplicates events in memory for 1 hour — safe to call multiple times for the same event.

```ts
await billing.handleWebhook(payload: WebhookPayload);
```

**Supported event types:**

| Lemon Squeezy event | Callback |
|---|---|
| `order_created` | `onPurchase` |
| `order_refunded` | `onRefund` |
| `subscription_created` | `onSubscriptionCreated` |
| `subscription_updated` | `onSubscriptionUpdated` |
| `subscription_cancelled` | `onSubscriptionCancelled` |
| `subscription_expired` | `onSubscriptionExpired` |
| `subscription_payment_failed` | `onPaymentFailed` |

---

### `billing.refreshPlans()`

Re-fetches products and variants from the API and updates the cache. Call this after adding new products in the Lemon Squeezy dashboard.

```ts
await billing.refreshPlans();
// billing.plans is now updated
```

---

### `billing.getCustomerPortal(customerId)`

Returns the customer portal URL for a given Lemon Squeezy customer ID. Useful for "Manage subscription" links.

```ts
const portalUrl = await billing.getCustomerPortal(customerId);
// redirect user to portalUrl
```

---

### `billing.getExpressRouter(options)`

Returns an Express router with three pre-wired routes. See the [Express Router](#express-router) section.

---

## Webhook Handling

Webhooks are the most common source of billing bugs. Here's the full picture.

### Manual setup (any framework)

```ts
app.post(
  "/webhooks/lemonsqueezy",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["x-signature"] as string;
    const rawBody = req.body.toString("utf-8");

    if (!billing.verifyWebhook(rawBody, signature)) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    const payload = JSON.parse(rawBody);
    await billing.handleWebhook(payload);

    res.json({ ok: true });
  }
);
```

**Critical:** use `express.raw()` (or equivalent) on the webhook route. Parsing the body as JSON before verification will break the HMAC check.

### Event payloads

**`PurchaseEvent`** (from `onPurchase`)
```ts
{
  userId: string;       // your user ID from custom_data
  email: string;
  orderId: string;
  customerId: string;   // Lemon Squeezy customer ID
  variantId: string;
  productName: string;
  price: number;        // in cents
}
```

**`RefundEvent`** (from `onRefund`)
```ts
{
  userId: string;
  email: string;
  orderId: string;
}
```

**`SubscriptionEvent`** (from subscription callbacks)
```ts
{
  userId: string;
  email: string;
  subscriptionId: string;
  customerId: string;
  variantId: string;
  status: string;
}
```

**`PaymentFailedEvent`** (from `onPaymentFailed`)
```ts
{
  userId: string;
  email: string;
  subscriptionId: string;
  customerId: string;
  reason: string;
}
```

### Deduplication

The webhook handler keeps an in-memory set of `eventName + dataId` pairs with a 1-hour TTL. Duplicate deliveries from Lemon Squeezy are silently skipped. This is process-local — if you run multiple instances, consider adding a database-backed dedup layer on top.

---

## Express Router

The built-in router wires up three routes automatically:

```ts
import express from "express";

const app = express();
const router = billing.getExpressRouter({
  requireAuth: (req, res, next) => {
    if (!req.session?.userId) return res.status(401).json({ error: "Unauthorized" });
    next();
  },
  getUserId: (req) => req.session.userId,
  getUserEmail: (req) => req.session.email,
});

app.use("/billing", router);
```

**Routes:**

| Method | Path | Description |
|---|---|---|
| `GET` | `/billing/plans` | Returns `billing.plans` as JSON |
| `GET` | `/billing/checkout?variantId=...` | Creates and returns a checkout URL |
| `POST` | `/billing/webhook` | Verifies + handles webhook (raw body middleware applied automatically) |

`requireAuth` is optional. If omitted, `/plans` and `/checkout` are public. The `/webhook` route is always public (Lemon Squeezy needs to reach it).

**Response shape:**

```json
{ "success": true, "data": { "checkoutUrl": "https://..." } }
{ "success": false, "error": "Query parameter variantId is required" }
```

---

## Logger

### File logger

Writes NDJSON to a file. The directory is created automatically.

```ts
const billing = await createBilling({
  logger: { filePath: "./logs/billing.log" },
  // ...
});
```

Each line is a JSON object:

```json
{"ts":"2026-01-01T12:00:00.000Z","op":"createCheckout","status":"ok","durationMs":312,"input":{"variantId":"abc","email":"jo***@example.com","userId":"user_123"},"output":{"checkoutUrl":"https://your-store.lemonsqueezy.com/..."}}
```

API keys and emails are masked automatically.

### Bring-your-own logger

Pass any object with `info`, `warn`, and `error` methods:

```ts
import pino from "pino";

const logger = pino();

const billing = await createBilling({
  logger: {
    custom: {
      info: (entry) => logger.info(entry),
      warn: (entry) => logger.warn(entry),
      error: (entry) => logger.error(entry),
    },
  },
  // ...
});
```

---

## Cache

On first run, `createBilling()` fetches your store and all products from the Lemon Squeezy API and writes `billing-cache.json` to your working directory (configurable via `cachePath`).

```json
{
  "generatedAt": "2026-01-01T12:00:00.000Z",
  "store": {
    "id": "270009",
    "name": "My Store",
    "slug": "my-store",
    "currency": "USD"
  },
  "products": [
    {
      "id": "123",
      "name": "Pro Plan",
      "description": "...",
      "status": "published",
      "variants": [
        {
          "id": "456",
          "name": "Monthly",
          "price": 999,
          "priceFormatted": "$9.99",
          "isSubscription": true,
          "status": "published"
        }
      ]
    }
  ]
}
```

The cache is valid for 1 hour by default (`cacheTtlMs`). After expiry, the next `createBilling()` call re-fetches from the API. Call `billing.refreshPlans()` to force a refresh at any time.

Commit `billing-cache.json` to your repo if you want a readable record of your product catalog. Add it to `.gitignore` if you prefer to always fetch fresh.

---

## Comparison

| Feature | Raw LS SDK | lemonsqueezy-webhooks | This Package |
|---|---|---|---|
| Store/product auto-discovery | Manual API calls | | Automatic |
| Checkout sessions | Low-level | | With retry + expiry |
| Webhook verification | DIY | | |
| Webhook deduplication | | | |
| Event dispatch (7 types) | | | |
| Structured logging | | | |
| Express router | | | |
| Cache to JSON | | | |
| Retry with backoff | | | |
| Maintained (2026) | | Stale | |

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## License

MIT. Copyright 2026 Yosef Hayim Sabag. See [LICENSE](./LICENSE).
