# fresh-squeezy

> The missing billing layer for Lemon Squeezy — auto-discover, checkout, webhooks, subscriptions, and licenses in one function call.

[![npm](https://img.shields.io/npm/v/fresh-squeezy)](https://www.npmjs.com/package/fresh-squeezy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Install

```bash
npm install fresh-squeezy
# peer deps
npm install @lemonsqueezy/lemonsqueezy.js
```

## Quick Start

```ts
import { createBilling } from "fresh-squeezy";

const billing = await createBilling({
  apiKey: process.env.LS_API_KEY!,
  webhookSecret: process.env.LS_WEBHOOK_SECRET!,
  callbacks: {
    onPurchase: async ({ userId, email, orderId, productName, price }) => {
      await db.grantAccess(userId);
    },
    onSubscription: async (event, method) => {
      if (method === "cancelled") await db.revokeAccess(event.userId);
    },
    onSubscriptionPayment: async (event, method) => {
      if (method === "success") await db.extendAccess(event.userId);
    },
  },
});

// Create a checkout URL
const url = await billing.createCheckout({
  variantId: "123456",
  email: "user@example.com",
  userId: "user_abc",
});

// Verify + handle a webhook (Express example)
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["x-signature"] as string;
  if (!billing.verifyWebhook(req.body.toString(), sig)) return res.sendStatus(401);
  await billing.handleWebhook(JSON.parse(req.body.toString()));
  res.json({ ok: true });
});
```

## Setup Wizard

Run the interactive wizard to generate a `billing-config.ts` for your project:

```bash
pnpm wizard
# or after installing the package globally:
npx fresh-squeezy-billing wizard
```

The wizard:
- Validates your API key against Lemon Squeezy
- Lets you select stores, products, and webhook events
- Generates `billing-config.ts` and `example.ts` in your project root
- Optionally runs all 6 API lifecycle test phases (setup → customer → order → subscription → license → cleanup)

## Configuration

```ts
interface BillingConfig {
  apiKey: string;
  storeId?: string;
  webhookSecret?: string;
  cachePath?: string;        // default: "./billing-cache.json"
  cacheTtlMs?: number;       // default: 3 600 000 (1 hour)
  checkoutExpiresInMs?: number | null;
  logger?: { filePath: string } | { custom: BillingLogger };
  callbacks: BillingCallbacks;
  dedup?: DedupConfig;
}
```

## Callbacks

```ts
interface BillingCallbacks {
  onPurchase: (event: PurchaseEvent) => Promise<void>;
  onRefund?: (event: RefundEvent) => Promise<void>;
  onSubscription?: (event: AnySubscriptionEvent, method: SubscriptionMethod) => Promise<void>;
  // method: 'created' | 'updated' | 'cancelled' | 'expired' | 'paused' | 'resumed'
  onSubscriptionPayment?: (event: SubscriptionPaymentSuccessEvent | SubscriptionPaymentRecoveredEvent, method: 'success' | 'recovered') => Promise<void>;
  onPaymentFailed?: (event: PaymentFailedEvent) => Promise<void>;
  onLicenseKey?: (method: 'created' | 'updated', event: LicenseKeyEvent) => Promise<void>;
  onWebhook?: (eventType: string, event: unknown) => Promise<void>;
}
```

## Billing API

```ts
billing.stores                              // StoreInfo[]
billing.plans                               // Plan[]  (auto-refreshed from cache)
billing.createCheckout(params)              // Promise<string>  — checkout URL
billing.verifyWebhook(rawBody, sig)         // boolean
billing.handleWebhook(payload)              // Promise<void>
billing.refreshPlans()                      // Promise<void>
billing.getCustomerPortal(customerId)       // Promise<string>  — portal URL
billing.getExpressRouter(options)           // Express Router

// Subscriptions
billing.pauseSubscription(id, reason?)
billing.resumeSubscription(id)
billing.cancelSubscription(id, immediately?)
billing.changeSubscriptionVariant(id, variantId)
billing.resumeCancelledSubscription(id)

// Licenses
billing.validateLicense(key)               // Promise<{ valid: boolean; details? }>
billing.getLicenseDetails(key)             // Promise<LicenseKeyEvent | null>
billing.activateLicense(key, instanceName) // Promise<{ activated: boolean; instanceId? }>
billing.deactivateLicense(key, instanceId) // Promise<boolean>

// Customers
billing.getCustomerByEmail(email)
billing.getSubscriptionsForUser(userId)

// Webhooks
billing.createWebhook(url, events, secret?)
billing.deleteWebhook(webhookId)

// Other
billing.healthCheck()
billing.dedupBackend
```

## Express Router

```ts
import express from "express";

const app = express();
app.use("/billing", billing.getExpressRouter({
  webhookPath: "/webhook",
  checkoutPath: "/checkout",
}));
```

## Deduplication

By default, webhook deduplication is in-memory and process-local. Swap in Redis or a database backend:

```ts
import { RedisDedupBackend } from "fresh-squeezy";

const billing = await createBilling({
  // ...
  dedup: {
    backend: new RedisDedupBackend(redisClient),
    ttlMs: 86_400_000,
  },
});
```

## CLI

```bash
npx fresh-squeezy-billing wizard     # interactive setup
npx fresh-squeezy-billing validate   # run validation suite
npx fresh-squeezy-billing help
```

## Requirements

- Node.js ≥ 20
- `@lemonsqueezy/lemonsqueezy.js` ≥ 3.2.0
- Express ≥ 4.18 (optional, only if using `getExpressRouter`)

## License

MIT
