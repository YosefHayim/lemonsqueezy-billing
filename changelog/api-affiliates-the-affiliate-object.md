# The Affiliate Object

**Source**: https://docs.lemonsqueezy.com/api/affiliates/the-affiliate-object

## Attributes

| Property | Description |
|----------|-------------|
| `store_id` | The ID of the store this affiliate belongs to. |
| `user_id` | The ID of the user this affiliate belongs to. |
| `user_name` | The full name of the affiliate. |
| `user_email` | The email address of the affiliate. |
| `share_domain` | The domain this affiliate uses to promote products. |
| `status` | The status of the affiliate. Either active, pending or disabled. |
| `application_note` | The application note of the affiliate. |
| `products` | The list of products enabled for this affiliate in the JSON format. |
| `total_earnings` | A positive integer in cents representing the total earnings of the affiliate. |
| `unpaid_earnings` | A positive integer in cents representing the unpaid earnings of the affiliate. |
| `created_at` | An ISO 8601 formatted date-time string indicating when the object was created. |
| `updated_at` | An ISO 8601 formatted date-time string indicating when the object was last updated. |

## JSON Example

```json
{
  "type": "affiliates",
  "id": "1",
  "attributes": {
    "store_id": 1,
    "user_id": 2,
    "user_name": "John Doe",
    "user_email": "[email protected]",
    "share_domain": "example.com",
    "status": "active",
    "products": null,
    "application_note": "I'm a digital content creator and marketer promoting B2B solutions via my newsletter",
    "total_earnings": 169550,
    "unpaid_earnings": 132000,
    "created_at": "2023-11-22T04:12:50.000000Z",
    "updated_at": "2023-11-22T04:12:50.000000Z"
  }
}
```
