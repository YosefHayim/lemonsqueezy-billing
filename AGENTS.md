# AGENTS.md

Context for AI coding agents (Claude Code, Cursor, GitHub Copilot, etc.).

## What This Package Does

`@yosefhayim/lemonsqueezy-billing` is a TypeScript abstraction over the Lemon Squeezy SDK. It handles four concerns:

1. **Bootstrap** — authenticates with the LS API, discovers stores and products, writes a local cache
2. **Checkout** — creates per-user checkout URLs with retry and expiry
3. **Webhooks** — verifies HMAC signatures, deduplicates events, dispatches to typed callbacks
4. **Delivery** — optional Express router, structured NDJSON logger, customer portal URL

The public API is a single factory function: `createBilling(config) => Promise<Billing>`.

## Directory Structure

```
src/
  types.ts        All TypeScript interfaces and type definitions
  createBilling.ts  Factory function — assembles and returns the Billing object
  bootstrap.ts    LS SDK setup, store/product discovery, cache read/write
  plans.ts        fetchStores(), fetchProducts(), flattenPlans()
  cache.ts        readCache(), writeCache(), isCacheValid()
  checkout.ts     createCheckoutFactory() — builds per-user checkout URLs
  webhook.ts      createWebhookVerifier(), createWebhookHandler() with dedup
  portal.ts       getCustomerPortalUrl()
  express.ts      createExpressRouter() — GET /plans, GET /checkout, POST /webhook
  logger.ts       createLogger(), withLogger() higher-order wrapper
  retry.ts        withRetry() — exponential backoff on 429/5xx
  index.ts        Public exports
```

## Build Commands

| Command | What it does |
|---|---|
| `pnpm build` | Compiles TypeScript to `dist/` via `tsc` |
| `pnpm typecheck` | Type-checks without emitting (`tsc --noEmit`) |
| `pnpm clean` | Removes `dist/` |

Always run `pnpm typecheck && pnpm build` after changes. Both must pass before committing.

## Code Style

- TypeScript strict mode. Zero `any`. Zero type assertions unless the LS SDK forces it.
- ESM only. All imports use `.js` extensions (required for Node ESM).
- No inline comments. Names should explain intent.
- Each file stays under 200 lines. Split if it grows.
- No external runtime dependencies. The LS SDK is a peer dep, Express is optional.
- All async functions return typed promises. No implicit `void`.

## Git Workflow

Conventional commits only:

```
feat: add onSubscriptionPaused callback
fix: handle empty custom_data in webhook payload
refactor: extract dedup logic from webhook handler
docs: update Express router example
```

One logical change per commit. No "WIP" commits on main.

## Testing

There's no automated test suite. Validation is:

1. `pnpm typecheck` — must pass with zero errors
2. `pnpm build` — must produce `dist/` without errors
3. Manual smoke test against a real LS API key (see README Quick Start)

When adding new functionality, ensure `types.ts` is updated first — types are the contract.

## Key Constraints

- `billing-cache.json` is written to the working directory by default. Don't hardcode paths.
- Webhook verification requires the raw body string before JSON parsing. The Express router handles this automatically via `express.raw()`.
- `userId` flows through the system via `custom_data.user_id` in the checkout, then back out via `payload.meta.custom_data.user_id` in the webhook. Don't break this chain.
- The dedup map is in-memory and process-local. Don't add persistence without a config option.
