# The License Key Object

**Source**: https://docs.lemonsqueezy.com/api/license-keys/the-license-key-object

## Attributes

| Property | Description |
|----------|-------------|
| `store_id` | The ID of the store this license key belongs to. |
| `customer_id` | The ID of the customer this license key belongs to. |
| `order_id` | The ID of the order associated with this license key. |
| `order_item_id` | The ID of the order item associated with this license key. |
| `product_id` | The ID of the product associated with this license key. |
| `user_name` | The full name of the customer. |
| `user_email` | The email address of the customer. |
| `key` | The full license key. |
| `key_short` | A “short” representation of the license key, made up of the string “XXXX-” followed by the last 12 characters of the license key. |
| `activation_limit` | The activation limit of this license key. |
| `instances_count` | A count of the number of instances this license key has been activated on. |
| `disabled` | Has the value true if this license key has been disabled. |
| `status` | The status of the license key. One of |
| `status_formatted` | The formatted status of the license key. |
| `expires_at` | An ISO 8601 formatted date-time string indicating when the license key expires. Can be null if the license key is perpetual. |
| `created_at` | An ISO 8601 formatted date-time string indicating when the object was created. |
| `updated_at` | An ISO 8601 formatted date-time string indicating when the object was last updated. |

## JSON Example

```json
{
  "type": "license-keys",
  "id": "1",
  "attributes": {
    "store_id": 1,
    "customer_id": 1,
    "order_id": 1,
    "order_item_id": 1,
    "product_id": 1,
    "user_name": "John Doe",
    "user_email": "[email protected]",
    "key": "80e15db5-c796-436b-850c-8f9c98a48abe",
    "key_short": "XXXX-8f9c98a48abe",
    "activation_limit": 5,
    "instances_count": 0,
    "disabled": 0,
    "status": "inactive",
    "status_formatted": "Inactive",
    "expires_at": null,
    "created_at": "2024-05-24T14:15:07.000000Z",
    "updated_at": "2024-05-24T14:15:07.000000Z"
  }
}
```
