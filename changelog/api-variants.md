# The Variant Object

**Source**: https://docs.lemonsqueezy.com/api/variants#the-variant-object

## Attributes

| Property | Description |
|----------|-------------|
| `product_id` | The ID of the product this variant belongs to. |
| `name` | The name of the variant. |
| `slug` | The slug used to identify the variant. |
| `description` | The description of the variant in HTML. |
| `has_license_keys` | Has the value true if this variant should generate license keys for the customer on purchase. |
| `license_activation_limit` | The maximum number of times a license key can be activated for this variant. |
| `is_license_limit_unlimited` | Has the value true if license key activations are unlimited for this variant. |
| `license_length_value` | The number of units (specified in the license_length_unit attribute) until a license key expires. |
| `license_length_unit` | The unit linked with the license_length_value attribute. One of |
| `is_license_length_unlimited` | Has the value true if license keys should never expire. |
| `links` | An array of the link objects. |
| `sort` | An integer representing the order of this variant when displayed on the checkout. |
| `status` | The status of the variant. One of |
| `status_formatted` | The formatted status of the variant. |
| `created_at` | An ISO 8601 formatted date-time string indicating when the object was created. |
| `updated_at` | An ISO 8601 formatted date-time string indicating when the object was last updated. |
| `test_mode` | A boolean indicating if the object was created within test mode. |
| `price-deprecated` | A positive integer in cents representing the price of the variant. |
| `is_subscription-deprecated` | Has the value true if this variant is a subscription. |
| `interval-deprecated` | If this variant is a subscription, this is the frequency at which a subscription is billed. One of |
| `interval_count-deprecated` | If this variant is a subscription, this is the number of intervals (specified in the interval attribute) between subscription billings. For example, interval=month and interval_count=3 bills every 3 months. |
| `has_free_trial-deprecated` | Has the value true if this variant has a free trial period. Only available if the variant is a subscription. |
| `trial_interval-deprecated` | The interval unit of the free trial. One of |
| `trial_interval_count-deprecated` | If interval count of the free trial. For example, a variant with trial_interval=day and trial_interval_count=14 would have a free trial that lasts 14 days. |
| `pay_what_you_want-deprecated` | Has the value true if this is a “pay what you want” variant where the price can be set by the customer at checkout. |
| `min_price-deprecated` | If pay_what_you_want is true, this is the minimum price this variant can be purchased for, as a positive integer in cents. |
| `suggested_price-deprecated` | If pay_what_you_want is true, this is the suggested price for this variant shown at checkout, as a positive integer in cents. |

## JSON Example

```json
{
  "type": "variants",
  "id": "1",
  "attributes": {
    "product_id": 1,
    "name": "Example Variant",
    "slug": "46beb127-a8a9-33e6-89b5-078505657239",
    "description": "<p>Lorem ipsum...</p>",
    "price": 999,
    "is_subscription": false,
    "interval": null,
    "interval_count": null,
    "has_free_trial": false,
    "trial_interval": "day",
    "trial_interval_count": 30,
    "pay_what_you_want": false,
    "min_price": 0,
    "suggested_price": 0,
    "has_license_keys": false,
    "license_activation_limit": 5,
    "is_license_limit_unlimited": false,
    "license_length_value": 1,
    "license_length_unit": "years",
    "is_license_length_unlimited": false,
    "sort": 1,
    "status": "published",
    "status_formatted": "Published",
    "created_at": "2021-05-24T14:15:06.000000Z",
    "updated_at": "2021-06-24T14:44:38.000000Z",
    "test_mode": false
  }
}
```
