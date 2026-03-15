# The Customer Object

**Source**: https://docs.lemonsqueezy.com/api/customers/the-customer-object

## Attributes

| Property | Description |
|----------|-------------|
| `store_id` | The ID of the store this customer belongs to. |
| `name` | The full name of the customer |
| `email` | The email address of the customer. |
| `status` | The email marketing status of the customer. One of |
| `city` | The city of the customer. |
| `region` | The region of the customer. |
| `country` | The country of the customer. |
| `total_revenue_currency` | A positive integer in cents representing the total revenue from the customer (USD). |
| `mrr` | A positive integer in cents representing the monthly recurring revenue from the customer (USD). |
| `status_formatted` | The formatted status of the customer. |
| `country_formatted` | The formatted country of the customer. |
| `total_revenue_currency_formatted` | A human-readable string representing the total revenue from the customer (e.g. $9.99). |
| `mrr_formatted` | A human-readable string representing the monthly recurring revenue from the customer (e.g. $9.99). |
| `urls` | An object of customer-facing URLs. It contains: |
| `created_at` | An ISO 8601 formatted date-time string indicating when the object was created. |
| `updated_at` | An ISO 8601 formatted date-time string indicating when the object was last updated. |
| `test_mode` | A boolean indicating if the object was created within test mode. |

## JSON Example

```json
{
  "type": "customers",
  "id": "1",
  "attributes": {
    "store_id": 1,
    "name": "John Doe",
    "email": "[email protected]",
    "status": "subscribed",
    "city": null,
    "region": null,
    "country": "US",
    "total_revenue_currency": 84332,
    "mrr": 1999,
    "status_formatted": "Subscribed",
    "country_formatted": "United States",
    "total_revenue_currency_formatted": "$843.32",
    "mrr_formatted": "$19.99",
    "urls": {
      "customer_portal": "https://my-store.lemonsqueezy.com/billing?expires=1666869343&signature=82ae290ceac8edd4190c82825dd73a8743346d894a8ddbc4898b97eb96d105a5"
    },
    "created_at": "2022-12-01T13:01:07.000000Z",
    "updated_at": "2022-12-09T09:05:21.000000Z",
    "test_mode": false
  }
}
```
