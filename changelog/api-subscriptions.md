# The Subscription Object

**Source**: https://docs.lemonsqueezy.com/api/subscriptions#the-subscription-object

## Attributes

| Property | Description |
|----------|-------------|
| `store_id` | The ID of the store this subscription belongs to. |
| `customer_id` | The ID of the customer this subscription belongs to. |
| `order_id` | The ID of the order associated with this subscription. |
| `order_item_id` | The ID of the order item associated with this subscription. |
| `product_id` | The ID of the product associated with this subscription. |
| `variant_id` | The ID of the variant associated with this subscription. |
| `product_name` | The name of the product. |
| `variant_name` | The name of the variant. |
| `user_name` | The full name of the customer. |
| `user_email` | The email address of the customer. |
| `status` | The status of the subscription. One of |
| `status_formatted` | The title-case formatted status of the subscription. |
| `card_brand` | Lowercase brand of the card used to pay for the latest subscription payment. One of |
| `card_last_four` | The last 4 digits of the card used to pay for the latest subscription payment. Will be empty for non-card payments. |
| `payment_processor` | Lowercase name of the payment processing service through which the subscription’s payments are managed and processed. Returns stripe or paypal. |
| `pause` | An object containing the payment collection pause behaviour options for the subscription, if set. Options include: |
| `cancelled` | A boolean indicating if the subscription has been cancelled. |
| `trial_ends_at` | If the subscription has a free trial (status is on_trial), this will be an ISO 8601 formatted date-time string indicating when the trial period ends. For all other status values, this will be null. |
| `billing_anchor` | An integer representing a day of the month (21 equals 21st day of the month). This is the day on which subscription invoice payments are collected. |
| `first_subscription_item` | An object representing the first subscription item belonging to this subscription. |
| `urls` | An object of customer-facing URLs for managing the subscription. It contains: |
| `renews_at` | An ISO 8601 formatted date-time string indicating the end of the current billing cycle, and when the next invoice will be issued. This also applies to past_due subscriptions; renews_at will reflect the next renewal charge attempt. |
| `ends_at` | If the subscription has as status of cancelled or expired, this will be an ISO 8601 formatted date-time string indicating when the subscription expires (or expired). For all other status values, this will be null. |
| `created_at` | An ISO 8601 formatted date-time string indicating when the object was created. |
| `updated_at` | An ISO 8601 formatted date-time string indicating when the object was last updated. |
| `test_mode` | A boolean indicating if the object was created within test mode. |

## JSON Example

```json
{
  "type": "subscriptions",
  "id": "1",
  "attributes": {
    "store_id": 1,
    "customer_id": 1,
    "order_id": 1,
    "order_item_id": 1,
    "product_id": 1,
    "variant_id": 1,
    "product_name": "Lemonade",
    "variant_name": "Citrus Blast",
    "user_name": "John Doe",
    "user_email": "[email protected]",
    "status": "active",
    "status_formatted": "Active",
    "card_brand": "visa",
    "card_last_four": "4242",
    "payment_processor": "stripe",
    "pause": null,
    "cancelled": false,
    "trial_ends_at": null,
    "billing_anchor": 12,
    "first_subscription_item": {
      "id": 1,
      "subscription_id": 1,
      "price_id": 1,
      "quantity": 5,
      "created_at": "2021-08-11T13:47:28.000000Z",
      "updated_at": "2021-08-11T13:47:28.000000Z"
    },
    "urls": {
      "update_payment_method": "https://my-store.lemonsqueezy.com/subscription/1/payment-details?expires=1666869343&signature=9985e3bf9007840aeb3951412be475abc17439c449c1af3e56e08e45e1345413",
      "customer_portal": "https://my-store.lemonsqueezy.com/billing?expires=1666869343&signature=82ae290ceac8edd4190c82825dd73a8743346d894a8ddbc4898b97eb96d105a5",
      "customer_portal_update_subscription": "https://my-store.lemonsqueezy.com/billing/1/update?expires=1666869343&signature=e4fabc7ee703664d644bba9e79a9cd3dd00622308b335f3c166787f0b18999f2"
    },
    "renews_at": "2022-11-12T00:00:00.000000Z",
    "ends_at": null,
    "created_at": "2021-08-11T13:47:27.000000Z",
    "updated_at": "2021-08-11T13:54:19.000000Z",
    "test_mode": false
  }
}
```
