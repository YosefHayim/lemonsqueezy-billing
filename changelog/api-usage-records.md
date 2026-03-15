# The Usage Record Object

**Source**: https://docs.lemonsqueezy.com/api/usage-records

## Attributes

| Property | Description |
|----------|-------------|
| `subscription_item_id` | The ID of the subscription item this usage record belongs to. |
| `quantity` | A positive integer representing the usage to be reported. |
| `action` | The type of record. One of |
| `created_at` | An ISO 8601 formatted date-time string indicating when the object was created. |
| `updated_at` | An ISO 8601 formatted date-time string indicating when the object was last updated. |

## JSON Example

```json
{
  "type": "usage-records",
  "id": "1",
  "attributes": {
    "subscription_item_id": 1,
    "quantity": 5,
    "action": "increment",
    "created_at": "2023-07-24T14:44:38.000000Z",
    "updated_at": "2023-07-24T14:44:38.000000Z"
  }
}
```
