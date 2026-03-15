# The License Key Instance Object

**Source**: https://docs.lemonsqueezy.com/api/license-key-instances/the-license-key-instance-object

## Attributes

| Property | Description |
|----------|-------------|
| `license_key_id` | The ID of the license key this instance belongs to. |
| `identifier` | The unique identifier (UUID) for this instance. This is the instance_id returned when activating a license key. |
| `name` | The name of the license key instance. |
| `created_at` | An ISO 8601 formatted date-time string indicating when the object was created. |
| `updated_at` | An ISO 8601 formatted date-time string indicating when the object was last updated. |

## JSON Example

```json
{
  "type": "license-key-instances",
  "id": "1",
  "attributes": {
    "license_key_id": 1,
    "identifier": "f70a79fa-6054-433e-9c1b-6075344292e4",
    "name": "example.com",
    "created_at": "2024-05-24T14:15:07.000000Z",
    "updated_at": "2024-05-24T14:15:07.000000Z"
  }
}
```
