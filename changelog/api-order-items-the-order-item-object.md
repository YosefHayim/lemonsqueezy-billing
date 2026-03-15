# The Order Item Object

**Source**: https://docs.lemonsqueezy.com/api/order-items/the-order-item-object

## Attributes

| Property | Description |
|----------|-------------|
| `order_id` | The ID of the order this order item belongs to. |
| `product_id` | The ID of the product associated with this order item. |
| `variant_id` | The ID of the variant associated with this order item. |
| `product_name` | The name of the product. |
| `variant_name` | The name of the variant. |
| `price` | A positive integer in cents representing the price of this order item (in the order currency). |
| `quantity` | A positive integer representing the quantity of this order item. |
| `created_at` | An ISO 8601 formatted date-time string indicating when the object was created. |
| `updated_at` | An ISO 8601 formatted date-time string indicating when the object was last updated. |

## JSON Example

```json
{
  "type": "order-items",
  "id": "1",
  "attributes": {
    "order_id": 1,
    "product_id": 1,
    "variant_id": 1,
    "product_name": "Lemonade",
    "variant_name": "Citrus Blast",
    "price": 999,
    "quantity": 1,
    "created_at": "2021-05-24T14:15:06.000000Z",
    "updated_at": "2021-05-24T14:15:06.000000Z"
  }
}
```
