# The Subscription Item Object

**Source**: https://docs.lemonsqueezy.com/api/subscription-items

## Attributes

| Property | Description |
|----------|-------------|
| `subscription_id` | The ID of the Subscription associated with this subscription item. |
| `price_id` | The ID of the Price associated with this subscription item. |
| `quantity` | A positive integer representing the unit quantity of this subscription item. |
| `is_usage_based` | A boolean value indicating whether the related subscription product/variant has usage-based billing enabled. |
| `created_at` | An ISO 8601 formatted date-time string indicating when the subscription item was created. |
| `updated_at` | An ISO 8601 formatted date-time string indicating when the subscription item was last updated. |

## JSON Example

```json
{
  "type": "subscription-items",
  "id": "1",
  "attributes": {
    "subscription_id": 1,
    "price_id": 1,
    "quantity": 1,
    "is_usage_based": false,
    "created_at": "2023-07-18T12:16:24.000000Z",
    "updated_at": "2023-07-18T12:16:24.000000Z"
  },
  "relationships": {
    "subscription": {
      "links": {
        "related": "https://api.lemonsqueezy.com/v1/subscription-items/1/subscription",
        "self": "https://api.lemonsqueezy.com/v1/subscription-items/1/relationships/subscription"
      }
    },
    "price": {
      "links": {
        "related": "https://api.lemonsqueezy.com/v1/subscription-items/1/price",
        "self": "https://api.lemonsqueezy.com/v1/subscription-items/1/relationships/price"
      }
    },
    "usage-records": {
      "links": {
        "related": "https://api.lemonsqueezy.com/v1/subscription-items/1/usage-records",
        "self": "https://api.lemonsqueezy.com/v1/subscription-items/1/relationships/usage-records"
      }
    }
  },
  "links": {
    "self": "https://api.lemonsqueezy.com/v1/subscription-items/1"
  }
}
```
