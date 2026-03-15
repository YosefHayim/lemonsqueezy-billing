import { listCustomers, getCustomer, createCustomer, updateCustomer, archiveCustomer } from "@lemonsqueezy/lemonsqueezy.js";
import type { CustomerManagement, CustomerLookup } from "../types/index.js";
import { withRetry } from "./retry.js";

export function createCustomerManagement(): CustomerManagement {
  const getCustomerByEmail = async (email: string): Promise<CustomerLookup | null> => {
    const response = await withRetry(
      () => listCustomers({ filter: { email } }),
      "listCustomers"
    );

    if (response.error || !response.data?.data || response.data.data.length === 0) {
      return null;
    }

    const customer = response.data.data[0];
    const attrs = customer.attributes as {
      email: string;
      name: string;
      billing_address?: {
        name: string;
        address: string;
        address2?: string;
        city: string;
        country: string;
        zip: string;
        state?: string;
      };
    };

    // Get subscriptions for this customer
    const subscriptionsResponse = await withRetry(
      () => listCustomers({ filter: { email }, include: ["subscriptions"] }),
      "listCustomersWithSubscriptions"
    );

    const subscriptions = subscriptionsResponse.data?.included
      ?.filter(item => item.type === "subscription")
      .map(item => ({
        id: item.id,
        status: String(item.attributes.status ?? ""),
        variantId: String(item.attributes.variant_id ?? ""),
        productId: String(item.attributes.product_id ?? ""),
        price: Number(item.attributes.renews_at_price ?? 0),
        nextBillingDate: String(item.attributes.renews_at ?? ""),
        endsAt: String(item.attributes.ends_at ?? ""),
      })) || [];

    const billingAddress = attrs.billing_address ? {
      name: attrs.billing_address.name || attrs.name || "",
      address1: attrs.billing_address.address || "",
      address2: attrs.billing_address.address2 || undefined,
      city: attrs.billing_address.city || "",
      country: attrs.billing_address.country || "",
      zip: attrs.billing_address.zip || "",
      state: attrs.billing_address.state || undefined,
    } : undefined;

    return {
      id: customer.id,
      email: attrs.email,
      name: attrs.name,
      billingAddress,
      subscriptions,
    };
  };

  const getSubscriptionsForUser = async (userId: string): Promise<CustomerLookup['subscriptions']> => {
    // This would typically require storing the userId in custom_data
    // For now, we'll search by email if userId is an email
    if (userId.includes('@')) {
      const customer = await getCustomerByEmail(userId);
      return customer?.subscriptions || [];
    }

    // If userId is not an email, you would need to implement
    // a lookup mechanism based on your user database
    return [];
  };

  return {
    getCustomerByEmail,
    getSubscriptionsForUser,

    getCustomer: async (customerId: string) => {
      const response = await withRetry(() => getCustomer(customerId), "getCustomer");
      if (response.error) throw new Error(`Failed to get customer: ${response.error.message}`);
      return response.data?.data?.attributes ?? null;
    },

    createCustomer: async (storeId: string, name: string, email: string) => {
      const response = await withRetry(() => createCustomer(storeId, { name, email }), "createCustomer");
      if (response.error) throw new Error(`Failed to create customer: ${response.error.message}`);
      if (!response.data?.data) throw new Error("Customer created but no data returned");
      return response.data.data.id;
    },

    updateCustomer: async (customerId: string, params: { name?: string; email?: string }) => {
      const response = await withRetry(() => updateCustomer(customerId, params), "updateCustomer");
      if (response.error) throw new Error(`Failed to update customer: ${response.error.message}`);
    },

    archiveCustomer: async (customerId: string) => {
      const response = await withRetry(() => archiveCustomer(customerId), "archiveCustomer");
      if (response.error) throw new Error(`Failed to archive customer: ${response.error.message}`);
    },
  };
}
