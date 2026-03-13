# Update a License Key

**Source**: https://docs.lemonsqueezy.com/api/license-keys/update-license-key

## JSON Example

```json
{
  "jsonapi": {
    "version": "1.0"
  },
  "links": {
    "self": "https://api.lemonsqueezy.com/v1/subscription-item/1"
  },
  "data": {
    "type": "subscription-items",
    "id": "1",
    "attributes": {
      "subscription_id": 1,
      "price_id": 1,
      "quantity": 10,
      "is_usage_based": false,
      "created_at": "2023-07-18T12:16:24.000000Z",
      "updated_at": "2023-07-18T12:23:18.000000Z"
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
}
```
