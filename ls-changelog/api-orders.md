# The Order Object

**Source**: https://docs.lemonsqueezy.com/api/orders

## Attributes

| Property | Description |
|----------|-------------|
| `store_id` | The ID of the store this order belongs to. |
| `customer_id` | The ID of the customer this order belongs to. |
| `identifier` | The unique identifier (UUID) for this order. |
| `order_number` | An integer representing the sequential order number for this store. |
| `user_name` | The full name of the customer. |
| `user_email` | The email address of the customer. |
| `currency` | The ISO 4217 currency code for the order (e.g. USD, GBP, etc). |
| `currency_rate` | If the order currency is USD, this will always be 1.0. Otherwise, this is the currency conversion rate used to determine the cost of the order in USD at the time of purchase. |
| `subtotal` | A positive integer in cents representing the subtotal of the order in the order currency. |
| `setup_fee` | A positive integer in cents representing the setup fee of the order in the order currency. |
| `discount_total` | A positive integer in cents representing the total discount value applied to the order in the order currency. |
| `tax` | A positive integer in cents representing the tax applied to the order in the order currency. |
| `total` | A positive integer in cents representing the total cost of the order in the order currency. |
| `refunded_amount` | A positive integer in cents representing the refunded amount of the order in the order currency. |
| `subtotal_usd` | A positive integer in cents representing the subtotal of the order in USD. |
| `setup_fee_usd` | A positive integer in cents representing the setup fee of the order in USD. |
| `discount_total_usd` | A positive integer in cents representing the total discount value applied to the order in USD. |
| `tax_usd` | A positive integer in cents representing the tax applied to the order in USD. |
| `total_usd` | A positive integer in cents representing the total cost of the order in USD. |
| `refunded_amount_usd` | A positive integer in cents representing the refunded amount of the order in USD. |
| `tax_name` | The name of the tax rate (e.g. VAT, Sales Tax, etc) applied to the order. Will be null if no tax was applied. |
| `tax_rate` | If tax is applied to the order, this will be the rate of tax as a decimal percentage. |
| `tax_inclusive` | A boolean indicating if the order was created with tax inclusive or exclusive pricing. |
| `status` | The status of the order. One of: |
| `status_formatted` | The formatted status of the order. |
| `refunded` | Has the value true if the order has been fully refunded. |
| `refunded_at` | If the order has been fully refunded, this will be an ISO 8601 formatted date-time string indicating when the order was refunded. |
| `subtotal_formatted` | A human-readable string representing the subtotal of the order in the order currency (e.g. $9.99). |
| `setup_fee_formatted` | A human-readable string representing the setup fee of the order in the order currency (e.g. $9.99). |
| `discount_total_formatted` | A human-readable string representing the total discount value applied to the order in the order currency (e.g. $9.99). |
| `tax_formatted` | A human-readable string representing the tax applied to the order in the order currency (e.g. $9.99). |
| `total_formatted` | A human-readable string representing the total cost of the order in the order currency (e.g. $9.99). |
| `refunded_amount_formatted` | A human-readable string representing the refunded amount of the order in the order currency (e.g. $9.99). |
| `first_order_item` | An object representing the first Order Item belonging to this order. |
| `urls` | An object of customer-facing URLs for this order. It contains: |
| `created_at` | An ISO 8601 formatted date-time string indicating when the object was created. |
| `updated_at` | An ISO 8601 formatted date-time string indicating when the object was last updated. |
| `test_mode` | A boolean indicating if the object was created within test mode. |

## JSON Example

```json
{
  "type": "orders",
  "id": "1",
  "attributes": {
    "store_id": 1,
    "customer_id": 1,
    "identifier": "104e18a2-d755-4d4b-80c4-a6c1dcbe1c10",
    "order_number": 1,
    "user_name": "John Doe",
    "user_email": "[email protected]",
    "currency": "USD",
    "currency_rate": "1.0000",
    "subtotal": 999,
    "setup_fee": 999,
    "discount_total": 0,
    "tax": 200,
    "total": 1199,
    "subtotal_usd": 999,
    "setup_fee_usd": 999,
    "discount_total_usd": 0,
    "tax_usd": 200,
    "total_usd": 1199,
    "tax_name": "VAT",
    "tax_rate": "20.00",
    "tax_inclusive": false,
    "status": "paid",
    "status_formatted": "Paid",
    "refunded": false,
    "refunded_at": null,
    "subtotal_formatted": "$9.99",
    "setup_fee_formatted": "$9.99",
    "discount_total_formatted": "$0.00",
    "tax_formatted": "$2.00",
    "total_formatted": "$11.99",
    "first_order_item": {
      "id": 1,
      "order_id": 1,
      "product_id": 1,
      "variant_id": 1,
      "product_name": "Test Limited License for 2 years",
      "variant_name": "Default",
      "price": 1199,
      "created_at": "2021-08-17T09:45:53.000000Z",
      "updated_at": "2021-08-17T09:45:53.000000Z",
      "test_mode": false
    },
    "urls": {
      "receipt": "https://app.lemonsqueezy.com/my-orders/104e18a2-d755-4d4b-80c4-a6c1dcbe1c10?signature=8847fff02e1bfb0c7c43ff1cdf1b1657a8eed2029413692663b86859208c9f42"
    },
    "created_at": "2021-08-17T09:45:53.000000Z",
    "updated_at": "2021-08-17T09:45:53.000000Z",
    "test_mode": false
  }
}
```
