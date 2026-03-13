# 🍋 Lemon Squeezy API Update Task

## Upstream Changes Detected

**Changelog date**: February 25th, 2026
**Previous entry**: February 25th, 2026
**Detected**: 2026-03-13

### Changelog Bullets (verbatim)

- We added a new customer_updated webhook event so you can now watch for customer profile updates and sync changes to your application.  →  https://docs.lemonsqueezy.com/help/webhooks/event-types

## Generated API Context

The pipeline scraped the linked documentation pages. These are the source of truth — review before implementing:

- [`docs/api-ref/help-webhooks-event-types.md`](./docs/api-ref/help-webhooks-event-types.md)
- [`docs/api-ref/api-subscriptions.md`](./docs/api-ref/api-subscriptions.md)
- [`docs/api-ref/api-affiliates-the-affiliate-object.md`](./docs/api-ref/api-affiliates-the-affiliate-object.md)
- [`docs/api-ref/api-orders.md`](./docs/api-ref/api-orders.md)
- [`docs/api-ref/api-subscription-invoices.md`](./docs/api-ref/api-subscription-invoices.md)
- [`docs/api-ref/api-checkouts-create-checkout.md`](./docs/api-ref/api-checkouts-create-checkout.md)
- [`docs/api-ref/api-variants.md`](./docs/api-ref/api-variants.md)
- [`docs/api-ref/api-orders-generate-order-invoice.md`](./docs/api-ref/api-orders-generate-order-invoice.md)
- [`docs/api-ref/api-license-keys-update-license-key.md`](./docs/api-ref/api-license-keys-update-license-key.md)
- [`docs/api-ref/api-subscriptions-update-subscription.md`](./docs/api-ref/api-subscriptions-update-subscription.md)
- [`docs/api-ref/api-subscriptions-the-subscription-object.md`](./docs/api-ref/api-subscriptions-the-subscription-object.md)
- [`docs/api-ref/api-subscription-invoices-generate-subscription-invoice.md`](./docs/api-ref/api-subscription-invoices-generate-subscription-invoice.md)
- [`docs/api-ref/api-subscription-items-update-subscription-item.md`](./docs/api-ref/api-subscription-items-update-subscription-item.md)
- [`docs/api-ref/api-orders-the-order-object.md`](./docs/api-ref/api-orders-the-order-object.md)
- [`docs/api-ref/api-subscription-invoices-the-subscription-invoice-object.md`](./docs/api-ref/api-subscription-invoices-the-subscription-invoice-object.md)
- [`docs/api-ref/api-prices-the-price-object.md`](./docs/api-ref/api-prices-the-price-object.md)
- [`docs/api-ref/help-licensing-license-api.md`](./docs/api-ref/help-licensing-license-api.md)
- [`docs/api-ref/api-license-keys-the-license-key-object.md`](./docs/api-ref/api-license-keys-the-license-key-object.md)
- [`docs/api-ref/api-license-key-instances-the-license-key-instance-object.md`](./docs/api-ref/api-license-key-instances-the-license-key-instance-object.md)
- [`docs/api-ref/api-users-retrieve-user.md`](./docs/api-ref/api-users-retrieve-user.md)
- [`docs/api-ref/api-order-items-the-order-item-object.md`](./docs/api-ref/api-order-items-the-order-item-object.md)
- [`docs/api-ref/api-customers-create-customer.md`](./docs/api-ref/api-customers-create-customer.md)
- [`docs/api-ref/api-customers-update-customer.md`](./docs/api-ref/api-customers-update-customer.md)
- [`docs/api-ref/api-customers-the-customer-object.md`](./docs/api-ref/api-customers-the-customer-object.md)
- [`docs/api-ref/help-online-store-customer-portal.md`](./docs/api-ref/help-online-store-customer-portal.md)
- [`docs/api-ref/help-products-pricing-models.md`](./docs/api-ref/help-products-pricing-models.md)
- [`docs/api-ref/help-products-usage-based-billing.md`](./docs/api-ref/help-products-usage-based-billing.md)
- [`docs/api-ref/api-checkouts.md`](./docs/api-ref/api-checkouts.md)
- [`docs/api-ref/api-subscription-items.md`](./docs/api-ref/api-subscription-items.md)
- [`docs/api-ref/api-prices.md`](./docs/api-ref/api-prices.md)
- [`docs/api-ref/api-usage-records.md`](./docs/api-ref/api-usage-records.md)
- [`docs/api-ref/help-webhooks.md`](./docs/api-ref/help-webhooks.md)
- [`docs/api-ref/help-integrations-zapier.md`](./docs/api-ref/help-integrations-zapier.md)
- [`docs/api-ref/api-webhooks.md`](./docs/api-ref/api-webhooks.md)
- [`docs/api-ref/guides-developer-guide-managing-subscriptions.md`](./docs/api-ref/guides-developer-guide-managing-subscriptions.md)
- [`docs/api-ref/help-checkout-passing-custom-data.md`](./docs/api-ref/help-checkout-passing-custom-data.md)
- [`docs/api-ref/api-discount-redemptions.md`](./docs/api-ref/api-discount-redemptions.md)
- [`docs/api-ref/help-lemonjs-what-is-lemonjs.md`](./docs/api-ref/help-lemonjs-what-is-lemonjs.md)
- [`docs/api-ref/help-lemonjs-handling-events.md`](./docs/api-ref/help-lemonjs-handling-events.md)
- [`docs/api-ref/guides-developer-guide-webhooks.md`](./docs/api-ref/guides-developer-guide-webhooks.md)
- [`docs/api-ref/api-customers.md`](./docs/api-ref/api-customers.md)

## AI Implementation Instructions

You are an expert TypeScript developer maintaining this Lemon Squeezy SDK wrapper. Execute steps strictly in order:

1. **Read the Context** — Open every file listed under *Generated API Context*. Those Markdown files contain the scraped attribute tables and JSON payloads — the absolute source of truth for this update.
2. **Compare and Diff** — Locate the corresponding TypeScript interfaces in `src/types/`. Compare our existing types against the newly provided schemas.
3. **Implement Updates**:
   - Add new properties with strict typing (no `any`).
   - Update modified payload structures or webhook event types.
   - Add new API endpoint wrapper methods if introduced, using correct HTTP verbs.
4. **Webhook events** — Update `src/types/webhook/types.ts` and `src/core/webhook.ts`. Add a fixture in `scripts/cli-test/fixtures/` and extend `scripts/cli-test/webhooks.ts`.
5. **Unknown payload shape** — If the changelog omits JSON structure, add:
   ```ts
   // TODO: verify payload shape at https://docs.lemonsqueezy.com/api/getting-started/changelog
   ```
6. **Safety** — Do NOT remove existing properties unless the changelog explicitly states deprecation or removal.

## Constraints

- Follow `.cursorrules` strictly.
- Only modify code directly implied by the changelog bullets above.
- Do NOT refactor unrelated code.
- Run `pnpm typecheck && pnpm build` before committing.

## Links

- Changelog: https://docs.lemonsqueezy.com/api/getting-started/changelog
- Webhooks reference: https://docs.lemonsqueezy.com/api/webhooks
