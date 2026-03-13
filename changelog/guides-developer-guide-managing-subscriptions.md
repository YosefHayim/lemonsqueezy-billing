# Updating billing details

**Source**: https://docs.lemonsqueezy.com/guides/developer-guide/managing-subscriptions#updating-billing-details

## Attributes

| Property | Description |
|----------|-------------|
| `grace-period` | If a subscription is cancelled mid billing period (either by the customer or by the store owner), it will enter a “grace period” before it expires at the next scheduled renewal date (refected in a subscription’s ends_at value). The customer should still have access to your app or product until this date because they have paid for that time period. |
| `expired-subscriptions` | If a subscription is cancelled and then reaches its next renewal date (ends_at) without being resumed, it will instead expire (its status will change to expired). |
| `pausing-a-subscription` | To pause a subscription, send a PATCH request containing a pause object: |
| `update-payment-method-modal` | To make the URL open in a more seamless overlay on top of your app (similar to the checkout overlay), use Lemon.js to open the URL with the LemonSqueezy.Url.Open() method. |

## JSON Example

```json
{
  "type": "subscriptions",
  "id": "1",
  "attributes": {
    ...
    "urls": {
      "update_payment_method": "https://my-store.lemonsqueezy.com/subscription/1/payment-details?expires=1674045831&signature=31cf3c83983a03a6cf92e4ec3b469fc044eace0a13183dcb1d7bc0da3bad6f31",
      "customer_portal": "https://my-store.lemonsqueezy.com/billing?expires=1674045831&signature=82ae290ceac8edd4190c82825dd73a8743346d894a8ddbc4898b97eb96d105a5"
    }
    ...
  }
}
```
