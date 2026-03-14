# Architecture

## Overview

`fresh-squeezy` is a TypeScript abstraction layer over the Lemon Squeezy SDK. It provides a unified API for billing operations including checkout sessions, webhooks, subscriptions, license keys, and customer management.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Application                                │
│                                                                  │
│  ┌──────────────────┐    ┌───────────────────────────────────┐  │
│  │   CLI / Wizard   │    │      Express Router (Optional)     │  │
│  │   (setup tool)   │    │   /plans  /checkout  /webhook    │  │
│  └────────┬─────────┘    └───────────────────┬───────────────┘  │
│           │                                    │                  │
│           ▼                                    ▼                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    createBilling()                          │ │
│  │                 (Factory Function)                           │ │
│  └─────────────────────────┬───────────────────────────────────┘ │
│                            │                                      │
│          ┌─────────────────┼─────────────────┐                  │
│          ▼                 ▼                 ▼                   │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────────┐  │
│  │   Bootstrap │   │   Checkout  │   │   Webhook Handler   │  │
│  │   (stores, │   │   (URLs)    │   │ (verify + dispatch) │  │
│  │   products) │   └─────────────┘   └─────────────────────┘  │
│  └─────────────┘                                                │
│                                                                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
              ┌───────────────────────────────┐
              │     Lemon Squeezy API         │
              │   (External HTTP API)          │
              └───────────────────────────────┘
```

## Core Modules

### 1. Bootstrap (`bootstrap.ts`)

Discovers stores and products from Lemon Squeezy API, manages caching.

```
Inputs: API Key
Outputs: Stores[], Products[], Cache
```

### 2. Checkout (`checkout.ts`)

Creates per-user checkout URLs with retry logic and expiry.

```
Inputs: variantId, email, userId
Outputs: Checkout URL string
```

Features:
- Exponential backoff on 429/5xx
- Configurable URL expiry (default 24h)
- Embeds userId in custom_data

### 3. Webhook (`webhook.ts`)

Verifies HMAC-SHA256 signatures and dispatches events to callbacks.

```
Inputs: Raw webhook payload, signature header
Outputs: Callback invocation
```

Features:
- Signature verification
- Event deduplication (in-memory or Redis/custom)
- 7 event types supported

### 4. Express Router (`express.ts`)

Optional Express middleware with pre-wired routes.

```
GET  /plans       → Returns available plans
GET  /checkout    → Creates checkout URL  
POST /webhook     → Handles incoming webhooks
```

### 5. Management APIs

| Module | Purpose |
|--------|---------|
| `subscriptions.ts` | Pause, resume, cancel, change variant |
| `licenses.ts` | Validate, activate, deactivate license keys |
| `customers.ts` | Get customer by email, subscriptions for user |
| `webhooks.ts` | Create/delete webhooks programmatically |

## Data Flow

### Initialization

```
1. createBilling(config)
      │
      ▼
2. bootstrap() → Fetch stores/products from LS API
      │
      ▼
3. writeCache() → Persist to billing-cache.json
      │
      ▼
4. Return Billing instance with all methods
```

### Checkout Flow

```
App calls billing.createCheckout({ variantId, email, userId })
      │
      ▼
withRetry() → HTTP POST to LS checkout API
      │
      ├── 429/5xx → Exponential backoff + retry
      │
      └── 200 → Return checkout URL
```

### Webhook Flow

```
POST /webhook (Express receives request)
      │
      ▼
billing.verifyWebhook(rawBody, signature)
      │
      ▼
billing.handleWebhook(payload)
      │
      ├── Deduplication check (skip if duplicate)
      │
      ├── Dispatch to appropriate callback
      │   ├── order_created        → onPurchase
      │   ├── order_refunded       → onRefund
      │   ├── subscription_created → onSubscriptionCreated
      │   └── ...
      │
      └── Return 200 OK
```

## Type System

```
types/
├── billing/         # Billing, BillingConfig, Plan, StoreInfo
├── cache/           # BillingCache, CachedProduct, CachedVariant
├── config/          # LoggerConfig, ExpressRouterOptions
├── license/         # LicenseKeyEvent, validation types
├── subscription/    # SubscriptionEvent, management types
└── webhook/         # WebhookPayload, event types
```

## Caching Strategy

- **Source of Truth**: Lemon Squeezy API
- **Local Cache**: `billing-cache.json` (configurable path)
- **TTL**: 1 hour default (configurable via `cacheTtlMs`)
- **Refresh**: `billing.refreshPlans()` forces re-fetch

## Deduplication

Process-local in-memory map with 1-hour TTL. For distributed systems, plug in:
- `RedisDedupBackend`
- `DatabaseDedupBackend`
- Custom via `DedupBackend` interface

## Logging

Structured NDJSON logging with automatic masking of:
- API keys
- Email addresses

Log levels: `info`, `warn`, `error`

## Directory Structure

```
src/
├── core/                 # Main billing logic
│   ├── bootstrap.ts      # Store/product discovery
│   ├── checkout.ts      # Checkout URL creation
│   ├── webhook.ts       # Webhook verification + handling
│   ├── express.ts       # Express router
│   ├── cache.ts         # Cache read/write
│   ├── logger.ts        # Structured logging
│   ├── retry.ts         # Exponential backoff
│   ├── dedup.ts         # Event deduplication
│   └── management/      # Subscriptions, licenses, customers
│
├── types/               # TypeScript interfaces
│   ├── billing/         # Core billing types
│   ├── webhook/         # Webhook event types
│   ├── subscription/    # Subscription types
│   └── ...
│
├── cli/                 # CLI tools
│   ├── cli.ts           # Main CLI entry
│   └── cli-validate.ts  # Validation commands
│
├── wizard.ts            # Interactive setup wizard
└── index.ts            # Public exports
```

## Security

- **Webhook Verification**: HMAC-SHA256 signature validation
- **No API Key Storage**: Keys passed at runtime, never persisted
- **Input Sanitization**: Email masking in logs
- **Secret Rotation**: Webhook secrets can be regenerated
