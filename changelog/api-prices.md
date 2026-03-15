# The Price Object

**Source**: https://docs.lemonsqueezy.com/api/prices

## Attributes

| Property | Description |
|----------|-------------|
| `variant_id` | The ID of the variant this price belongs to. |
| `category` | The type of variant this price was created for. One of: |
| `scheme` | The pricing model for this price. One of: |
| `usage_aggregation` | The type of usage aggregation in use if usage-based billing is activated. One of: |
| `unit_price` | A positive integer in cents representing the price. |
| `unit_price_decimal` | A positive decimal string in cents representing the price. |
| `setup_fee_enabled` | A boolean indicating if the price has a setup fee. |
| `setup_fee` | A positive integer in cents representing the setup fee. |
| `package_size` | The number of units included in each package when using package pricing. |
| `tiers` | A list of pricing tier objects when using volume and graduated pricing. |
| `renewal_interval_unit` | If the price’s variant is a subscription, the billing interval. One of: |
| `renewal_interval_quantity` | If the price’s variant is a subscription, this is the number of intervals (specified in the renewal_interval_unit attribute) between subscription billings. |
| `trial_interval_unit` | The interval unit of the free trial. One of |
| `trial_interval_quantity` | The interval count of the free trial. For example, a variant with trial_interval_unit=day and trial_interval_quantity=14 would have a free trial that lasts 14 days. |
| `min_price` | If category is pwyw, this is the minimum price this variant can be purchased for, as a positive integer in cents. |
| `suggested_price` | If category is pwyw, this is the suggested price for this variant shown at checkout, as a positive integer in cents. |
| `tax_code` | The product’s tax category. One of: |
| `created_at` | An ISO 8601 formatted date-time string indicating when the object was created. |
| `updated_at` | An ISO 8601 formatted date-time string indicating when the object was last updated. |

## JSON Example

```json
{
  "type": "prices",
  "id": "1",
  "attributes": {
    "variant_id": 1,
    "category": "subscription",
    "scheme": "graduated",
    "usage_aggregation": null,
    "unit_price": 999,
    "unit_price_decimal": null,
    "setup_fee_enabled": false,
    "setup_fee": null,
    "package_size": 1,
    "tiers": [
      {
        "last_unit": 2,
        "unit_price": 10000,
        "unit_price_decimal": null,
        "fixed_fee": 1000
      },
      {
        "last_unit": "inf",
        "unit_price": 1000,
        "unit_price_decimal": null,
        "fixed_fee": 1000
      }
    ],
    "renewal_interval_unit": "year",
    "renewal_interval_quantity": 1,
    "trial_interval_unit": "day",
    "trial_interval_quantity": 30,
    "min_price": null,
    "suggested_price": null,
    "tax_code": "eservice",
    "created_at": "2023-05-24T14:15:06.000000Z",
    "updated_at": "2023-06-24T14:44:38.000000Z"
  }
}
```
