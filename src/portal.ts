import { getCustomer } from "@lemonsqueezy/lemonsqueezy.js";
import { withRetry } from "./retry.js";

export async function getCustomerPortalUrl(customerId: string): Promise<string> {
  const response = await withRetry(
    () => getCustomer(customerId),
    "getCustomer"
  );

  if (response.error || !response.data?.data) {
    throw new Error(`Failed to get customer ${customerId}`);
  }

  const urls = response.data.data.attributes.urls;
  const portalUrl = urls.customer_portal;

  if (!portalUrl) {
    throw new Error(`No customer portal URL for customer ${customerId}`);
  }

  return portalUrl;
}
