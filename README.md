# lemonsqueezy-billing

**The missing billing layer for Lemon Squeezy. Auto-discover, checkout, webhooks — one function.**

[![npm version](https://img.shields.io/npm/v/@yosefhayim/lemonsqueezy-billing)](https://www.npmjs.com/package/@yosefhayim/lemonsqueezy-billing)
[![npm downloads](https://img.shields.io/npm/dm/@yosefhayim/lemonsqueezy-billing)](https://www.npmjs.com/package/@yosefhayim/lemonsqueezy-billing)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)

> [!WARNING]
> This is an **unofficial** community package. Not affiliated with or supported by Lemon Squeezy.

---

## Features

| Feature | Description |
|---|---|
| Auto-Discovery | Finds stores, products, and variants automatically |
| Checkout Sessions | Per-user URLs with retry and expiry |
| Webhook Handling | HMAC verification, deduplication, 7 event types |
| Structured Logging | NDJSON file logger or bring-your-own |
| Express Router | Drop-in router with `/plans`, `/checkout`, `/webhook` |
| Smart Cache | `billing-cache.json` as readable source of truth |

---

## Install

```bash
pnpm add @yosefhayim/lemonsqueezy-billing @lemonsqueezy/lemonsqueezy.js
```

For Express router: `pnpm add express`

---

## Quick Start

Run the interactive wizard to set up everything automatically:

```bash
pnpm run wizard
```

The wizard auto-detects your API keys, discovers stores/products, generates config, and runs validation tests.

---

## API Reference

### `createBilling(config)`

```ts
const billing = await createBilling({
  apiKey: string,              // required
  webhookSecret?: string,      // required for webhook verification
  storeId?: string,            // defaults to first store
  cachePath?: string,          // defaults to ./billing-cache.json
  checkoutExpiresInMs?: number, // defaults to 24h
  logger?: { filePath?: string; custom?: Logger },
  callbacks: {
    onPurchase: (event) => Promise<void>,      // required
    onRefund?: (event) => Promise<void>,
    onSubscriptionCreated?: (event) => Promise<void>,
    onSubscriptionUpdated?: (event) => Promise<void>,
    onSubscriptionCancelled?: (event) => Promise<void>,
    onSubscriptionExpired?: (event) => Promise<void>,
    onPaymentFailed?: (event) => Promise<void>,
  },
});
```

### `billing.createCheckout(params)`

```ts
const url = await billing.createCheckout({
  variantId: string,  // from billing.plans[n].variantId
  email: string,      // pre-fills checkout
  userId: string,     // comes back in webhook events
});
```

### `billing.handleWebhook(payload)`

Dispatches verified webhooks to callbacks. Handles deduplication automatically.

### `billing.verifyWebhook(rawBody, signature)`

Verifies HMAC-SHA256 signature. Use before `handleWebhook`.

### `billing.refreshPlans()`

Re-fetches products from API and updates cache.

### `billing.getCustomerPortal(customerId)`

Returns customer portal URL for subscription management.

---

## Express Router

```ts
import express from "express";
const app = express();

const router = billing.getExpressRouter({
  requireAuth: (req, res, next) => { /* auth check */ },
  getUserId: (req) => req.session.userId,
  getUserEmail: (req) => req.session.email,
});

app.use("/billing", router);
```

**Routes:** `GET /billing/plans` | `GET /billing/checkout?variantId=...` | `POST /billing/webhook`

---

## Comparison

| Feature | Raw LS SDK | lemonsqueezy-webhooks | This Package |
|---|---|---|---|
| Store/product auto-discovery | Manual API calls | | ✅ Automatic |
| Checkout sessions | Low-level | | ✅ With retry + expiry |
| Webhook verification | DIY | | ✅ Built-in |
| Webhook deduplication | | | ✅ |
| Event dispatch (7 types) | | | ✅ |
| Structured logging | | | ✅ |
| Express router | | | ✅ |
| Cache to JSON | | | ✅ |
| Retry with backoff | | | ✅ |
| Interactive wizard | | | ✅ |
| Validation tests | | | ✅ |
| Maintained (2026) | | Stale | ✅ |

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).
