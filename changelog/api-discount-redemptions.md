# The Discount Redemption Object

**Source**: https://docs.lemonsqueezy.com/api/discount-redemptions

## Attributes

| Property | Description |
|----------|-------------|
| `discount_id` | The ID of the discount this redemption belongs to. |
| `order_id` | The ID of the order this redemption belongs to. |
| `discount_name` | The name of the discount. |
| `discount_code` | The discount code that was used at checkout. |
| `discount_amount` | The amount of the discount. Either a fixed amount in cents or a percentage depending on the value of discount_amount_type. |
| `discount_amount_type` | The type of the discount_amount. Either percent or fixed. |
| `amount` | A positive integer in cents representing the amount of the discount that was applied to the order (in the order currency). |
| `created_at` | An ISO 8601 formatted date-time string indicating when the object was created. |
| `updated_at` | An ISO 8601 formatted date-time string indicating when the object was last updated. |

## JSON Example

```json
{
  "type": "discount-redemptions",
  "id": "1",
  "attributes": {
    "discount_id": 1,
    "order_id": 1,
    "discount_name": "10%",
    "discount_code": "10PERC",
    "discount_amount": 10,
    "discount_amount_type": "percent",
    "amount": 999,
    "created_at": "2024-02-07T10:30:01.000000Z",
    "updated_at": "2024-02-07T10:30:01.000000Z"
  }
}
```
