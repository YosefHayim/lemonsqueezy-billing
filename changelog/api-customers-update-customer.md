# Update a Customer

**Source**: https://docs.lemonsqueezy.com/api/customers/update-customer

## JSON Example

```json
{
  "jsonapi": {
    "version": "1.0"
  },
  "links": {
    "self": "https://api.lemonsqueezy.com/v1/customers/1"
  },
  "data": {
    "type": "customers",
    "id": "1",
    "attributes": {
      "store_id": 1,
      "name": "John Doe",
      "email": "[email protected]",
      "status": "archived",
      "city": null,
      "region": null,
      "country": "US",
      "total_revenue_currency": 0,
      "mrr": 0,
      "status_formatted": "Archived",
      "country_formatted": "United States",
      "total_revenue_currency_formatted": "$0.00",
      "mrr_formatted": "$0.00",
      "urls": {
        "customer_portal": null
      },
      "created_at": "2022-12-01T13:01:07.000000Z",
      "updated_at": "2022-12-09T09:05:21.000000Z",
      "test_mode": false
    },
    "relationships": {
      "store": {
        "links": {
          "related": "https://api.lemonsqueezy.com/v1/customers/1/store",
          "self": "https://api.lemonsqueezy.com/v1/customers/1/relationships/store"
        }
      },
      "orders": {
        "links": {
          "related": "https://api.lemonsqueezy.com/v1/customers/1/orders",
          "self": "https://api.lemonsqueezy.com/v1/customers/1/relationships/orders"
        }
      },
      "subscriptions": {
        "links": {
          "related": "https://api.lemonsqueezy.com/v1/customers/1/subscriptions",
          "self": "https://api.lemonsqueezy.com/v1/customers/1/relationships/subscriptions"
        }
      },
      "license-keys": {
        "links": {
          "related": "https://api.lemonsqueezy.com/v1/customers/1/license-keys",
          "self": "https://api.lemonsqueezy.com/v1/customers/1/relationships/license-keys"
        }
      }
    },
    "links": {
      "self": "https://api.lemonsqueezy.com/v1/customers/1"
    }
  }
}
```
