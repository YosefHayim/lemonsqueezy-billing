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

```ts
import { createBilling } from "fresh-squeezy";

const billing = await createBilling({
  apiKey: process.env.LS_API_KEY!,
  webhookSecret: process.env.LS_WEBHOOK_SECRET!,
  callbacks: {
    onPurchase: async (event) => {
      await db.grantAccess(event.userId); // event.orderId, .email, .productName, .price
    },
    onSubscription: async (event, method) => {
      // method: 'created' | 'updated' | 'cancelled' | 'expired' | 'paused' | 'resumed'
      if (method === "cancelled") await db.revokeAccess(event.userId);
    },
    onSubscriptionPayment: async (event, method) => {
      // method: 'success' | 'recovered'
      if (method === "success") await db.extendAccess(event.userId);
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

The fastest way to get started — interactive CLI that validates your keys, picks your products, and generates ready-to-run config files:

```bash
npx fresh-squeezy-billing wizard
```

Generates `.billing/billing-config.ts` and `.billing/example.ts` in your project.

> Built with [grimoire-wizard](https://github.com/YosefHayim/grimoire) — config-driven CLI wizard framework. The wizard steps are defined in YAML, with dynamic API integration via grimoire's programmatic hooks.

---

## Configuration

```ts
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

```ts
interface BillingCallbacks {
  onPurchase:           (event: PurchaseEvent) => Promise<void>;                                          // required
  onRefund?:            (event: RefundEvent) => Promise<void>;
  onSubscription?:      (event: AnySubscriptionEvent, method: SubscriptionMethod) => Promise<void>;
  onSubscriptionPayment?: (event: ..., method: 'success' | 'recovered') => Promise<void>;
  onPaymentFailed?:     (event: PaymentFailedEvent) => Promise<void>;
  onLicenseKey?:        (method: 'created' | 'updated', event: LicenseKeyEvent) => Promise<void>;
  onWebhook?:           (eventType: string, event: WebhookEvent) => Promise<void>;                       // catch-all
}

type SubscriptionMethod = 'created' | 'updated' | 'cancelled' | 'expired' | 'paused' | 'resumed';
```

---

## API Reference

```ts
// Core
billing.stores                                  // StoreInfo[]
billing.plans                                   // Plan[]
billing.createCheckout(params)                  // Promise<string>  — checkout URL
billing.verifyWebhook(rawBody, signature)       // boolean
billing.handleWebhook(payload)                  // Promise<void>
billing.refreshPlans()                          // Promise<void>
billing.getCustomerPortal(customerId)           // Promise<string>  — portal URL
billing.getExpressRouter(options)               // Express Router

// Subscriptions
billing.pauseSubscription(id, reason?)
billing.resumeSubscription(id)
billing.cancelSubscription(id, immediately?)
billing.changeSubscriptionVariant(id, variantId)
billing.resumeCancelledSubscription(id)

// Licenses
billing.validateLicense(key)                    // Promise<{ valid: boolean; details? }>
billing.getLicenseDetails(key)                  // Promise<LicenseKeyEvent | null>
billing.activateLicense(key, instanceName)      // Promise<{ activated: boolean; instanceId? }>
billing.deactivateLicense(key, instanceId)      // Promise<boolean>

// Customers
billing.getCustomerByEmail(email)               // Promise<CustomerLookup | null>
billing.getSubscriptionsForUser(userId)         // Promise<Subscription[]>

// Webhooks
billing.createWebhook(url, events, secret?)     // Promise<string>  — webhook ID
billing.deleteWebhook(webhookId)                // Promise<void>

// Health
billing.healthCheck()                           // Promise<HealthCheckResult>
```

---

## Express Router

Drop-in router for `/plans` and `/checkout` endpoints:

```ts
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

```ts
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
      onPurchase: async (event) => { /* event.userId, .orderId, .email, .price */ },
      onSubscription: async (event, method) => { /* method: created|updated|cancelled|expired|paused|resumed */ },
      onSubscriptionPayment: async (event, method) => { /* method: success|recovered */ },
    },
  });

  billing.plans           // available plans/variants
  billing.stores          // store info
  billing.createCheckout({ variantId, email, userId })  // → checkout URL string
  billing.verifyWebhook(rawBody, signature)             // → boolean
  billing.handleWebhook(payload)                        // dispatches to callbacks
  billing.getCustomerPortal(customerId)                 // → portal URL
  billing.pauseSubscription(id) / cancelSubscription(id) / resumeSubscription(id)
  billing.validateLicense(key)  // → { valid, details }
  billing.activateLicense(key, instanceName)  // → { activated, instanceId }

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

- Node.js ≥ 20
- `@lemonsqueezy/lemonsqueezy.js` ≥ 3.2.0 (peer dep)
- Express ≥ 4.18 (optional — only for `getExpressRouter`)

## License

MIT
