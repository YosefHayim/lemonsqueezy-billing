# The Subscription Invoice Object

**Source**: https://docs.lemonsqueezy.com/api/subscription-invoices/the-subscription-invoice-object

## Attributes

| Property | Description |
|----------|-------------|
| `store_id` | The ID of the Store this subscription invoice belongs to. |
| `subscription_id` | The ID of the Subscription associated with this subscription invoice. |
| `customer_id` | The ID of the customer this subscription invoice belongs to. |
| `user_name` | The full name of the customer. |
| `user_email` | The email address of the customer. |
| `billing_reason` | The reason for the invoice being generated. |
| `card_brand` | Lowercase brand of the card used to pay for the invoice. One of |
| `card_last_four` | The last 4 digits of the card used to pay for the invoice. Will be empty for non-card payments. |
| `currency` | The ISO 4217 currency code for the invoice (e.g. USD, GBP, etc). |
| `currency_rate` | If the invoice currency is USD, this will always be 1.0. Otherwise, this is the currency conversion rate used to determine the cost of the invoice in USD at the time of payment. |
| `status` | The status of the invoice. One of |
| `status_formatted` | The formatted status of the invoice. |
| `refunded` | A boolean value indicating whether the invoice has been fully refunded. |
| `refunded_at` | If the invoice has been fully refunded, this will be an ISO 8601 formatted date-time string indicating when the invoice was refunded. Otherwise, it will be null. |
| `subtotal` | A positive integer in cents representing the subtotal of the invoice in the invoice currency. |
| `discount_total` | A positive integer in cents representing the total discount value applied to the invoice in the invoice currency. |
| `tax` | A positive integer in cents representing the tax applied to the invoice in the invoice currency. |
| `tax_inclusive` | A boolean indicating if the order was created with tax inclusive or exclusive pricing. |
| `total` | A positive integer in cents representing the total cost of the invoice in the invoice currency. |
| `refunded_amount` | A positive integer in cents representing the refunded amount of the invoice in the invoice currency. |
| `subtotal_usd` | A positive integer in cents representing the subtotal of the invoice in USD. |
| `discount_total_usd` | A positive integer in cents representing the total discount value applied to the invoice in USD. |
| `tax_usd` | A positive integer in cents representing the tax applied to the invoice in USD. |
| `total_usd` | A positive integer in cents representing the total cost of the invoice in USD. |
| `refunded_amount_usd` | A positive integer in cents representing the refunded amount of the invoice in USD. |
| `subtotal_formatted` | A human-readable string representing the subtotal of the invoice in the invoice currency (e.g. $9.99). |
| `discount_total_formatted` | A human-readable string representing the total discount value applied to the invoice in the invoice currency (e.g. $9.99). |
| `tax_formatted` | A human-readable string representing the tax applied to the invoice in the invoice currency (e.g. $9.99). |
| `total_formatted` | A human-readable string representing the total cost of the invoice in the invoice currency (e.g. $9.99). |
| `refunded_amount_formatted` | A human-readable string representing the refunded amount of the invoice in the invoice currency (e.g. $9.99). |
| `urls` | An object of customer-facing URLs for the invoice. It contains: |
| `created_at` | An ISO 8601 formatted date-time string indicating when the invoice was created. |
| `updated_at` | An ISO 8601 formatted date-time string indicating when the invoice was last updated. |
| `test_mode` | A boolean indicating if the object was created within test mode. |

## JSON Example

```json
{
  "type": "subscription-invoices",
  "id": "1",
  "attributes": {
    "store_id": 1,
    "subscription_id": 1,
    "customer_id": 1,
    "user_name": "John Doe",
    "user_email": "[email protected]",
    "billing_reason": "initial",
    "card_brand": "visa",
    "card_last_four": "4242",
    "currency": "USD",
    "currency_rate": "1.00000000",
    "status": "paid",
    "status_formatted": "Paid",
    "refunded": false,
    "refunded_at": null,
    "subtotal": 999,
    "discount_total": 0,
    "tax": 0,
    "tax_inclusive": false,
    "total": 999,
    "refunded_amount": 100,
    "subtotal_usd": 999,
    "discount_total_usd": 0,
    "tax_usd": 0,
    "total_usd": 999,
    "refunded_amount_usd": 100,
    "subtotal_formatted": "$9.99",
    "discount_total_formatted": "$0.00",
    "tax_formatted": "$0.00",
    "total_formatted": "$9.99",
    "refunded_amount_formatted": "$1.00",
    "urls": {
      "invoice_url": "https://app.lemonsqueezy.com/my-orders/.../subscription-invoice/..."
    },
    "created_at": "2023-01-18T12:16:24.000000Z",
    "updated_at": "2023-01-18T12:16:24.000000Z",
    "test_mode": false
  },
  "relationships": {
    "store": {
      "links": {
        "related": "https://api.lemonsqueezy.com/v1/subscription-invoices/1/store",
        "self": "https://api.lemonsqueezy.com/v1/subscription-invoices/1/relationships/store"
      }
    },
    "subscription": {
      "links": {
        "related": "https://api.lemonsqueezy.com/v1/subscription-invoices/1/subscription",
        "self": "https://api.lemonsqueezy.com/v1/subscription-invoices/1/relationships/subscription"
      }
    },
    "customer": {
      "links": {
        "related": "https://api.lemonsqueezy.com/v1/subscription-invoices/1/customer",
        "self": "https://api.lemonsqueezy.com/v1/subscription-invoices/1/relationships/customer"
      }
    }
  },
  "links": {
    "self": "https://api.lemonsqueezy.com/v1/subscription-invoices/1"
  }
}
```
