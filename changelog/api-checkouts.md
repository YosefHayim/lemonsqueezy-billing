# The Checkout Object

**Source**: https://docs.lemonsqueezy.com/api/checkouts

## Attributes

| Property | Description |
|----------|-------------|
| `store_id` | The ID of the store this checkout belongs to. |
| `variant_id` | The ID of the variant associated with this checkout. |
| `custom_price` | If the value is not null, this represents a positive integer in cents representing the custom price of the variant. |
| `product_options` | An object containing any overridden product options for this checkout. Possible options include: |
| `checkout_options` | An object containing checkout options for this checkout. Possible options include: |
| `checkout_data` | An object containing any prefill or custom data to be used in the checkout. Possible options include: |
| `preview` | If preview is passed as true in the request, the Checkout object will contain a preview object. This contains pricing information for the checkout, including tax, any discount applied, and the total price. |
| `expires_at` | An ISO 8601 formatted date-time string indicating when the checkout expires. Can be null if the checkout is perpetual. |
| `created_at` | An ISO 8601 formatted date-time string indicating when the object was created. |
| `updated_at` | An ISO 8601 formatted date-time string indicating when the object was last updated. |
| `test_mode` | A boolean indicating if the object was created within test mode. |
| `url` | The unique URL to access the checkout. Note: for security reasons, download URLs are signed. If the checkout expires_at is set, the URL will expire after the specified time. |

## JSON Example

```json
{
    "type": "checkouts",
    "id": "ac470bd4-7c41-474d-b6cd-0f296f5be02a",
    "attributes": {
      "store_id": 1,
      "variant_id": 1,
      "custom_price": null,
      "product_options": {
        "name": "",
        "description": "",
        "media": [],
        "redirect_url": "",
        "receipt_button_text": "",
        "receipt_link_url": "",
        "receipt_thank_you_note": "",
        "enabled_variants": []
      },
      "checkout_options": {
        "embed": false,
        "media": true,
        "logo": true,
        "desc": true,
        "discount": true,
        "skip_trial": false,
        "subscription_preview": true,
        "button_color": "#7047EB"
      },
      "checkout_data": {
        "email": "",
        "name": "",
        "billing_address": [],
        "tax_number": "",
        "discount_code": "",
        "custom": [],
        "variant_quantities": []
      },
      "expires_at": null,
      "created_at": "2024-10-14T12:36:27.000000Z",
      "updated_at": "2024-10-14T12:36:27.000000Z",
      "test_mode": false,
      "url": "https://my-store.lemonsqueezy.com/checkout/custom/ac470bd4-7c41-474d-b6cd-0f296f5be02a?signature=ee3fd20c5bac48fe5e976cb106e743bc3f6f330540f8003ab331d638e2ce3b8b"
    },
    "relationships": {
      "store": {
        "links": {
          "related": "https://api.lemonsqueezy.com/v1/checkouts/ac470bd4-7c41-474d-b6cd-0f296f5be02a/store",
          "self": "https://api.lemonsqueezy.com/v1/checkouts/ac470bd4-7c41-474d-b6cd-0f296f5be02a/relationships/store"
        }
      },
      "variant": {
        "links": {
          "related": "https://api.lemonsqueezy.com/v1/checkouts/ac470bd4-7c41-474d-b6cd-0f296f5be02a/variant",
          "self": "https://api.lemonsqueezy.com/v1/checkouts/ac470bd4-7c41-474d-b6cd-0f296f5be02a/relationships/variant"
        }
      }
    },
    "links": {
      "self": "https://api.lemonsqueezy.com/v1/checkouts/ac470bd4-7c41-474d-b6cd-0f296f5be02a"
    }
  }
}
```
