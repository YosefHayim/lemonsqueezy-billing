# Handling Events with Lemon.js

**Source**: https://docs.lemonsqueezy.com/help/lemonjs/handling-events

## JSON Example

```json
{
  event: "PaymentMethodUpdate.Mounted"
}
{
  "event": "Checkout.Success",
  "data": {
    "type": "orders",
    "id": "1",
    "attributes": {
      "store_id": 1,
      "customer_id": 1,
      ...
    },
    ...
  }
}
```
