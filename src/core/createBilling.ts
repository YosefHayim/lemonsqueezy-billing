import type { Billing, BillingConfig, CheckoutParams, WebhookPayload, ExpressRouterOptions } from "../types/index.js";
import { bootstrap } from "./bootstrap.js";
import { createCheckoutFactory } from "./checkout.js";
import { createWebhookVerifier, createWebhookHandler } from "./webhook.js";
import { createLogger, withLogger } from "./logger.js";
import { createExpressRouter } from "./express.js";
import { getCustomerPortalUrl } from "./portal.js";
import { fetchProducts, flattenPlans } from "./plans.js";
import { writeCache } from "./cache.js";
import { createSubscriptionManagement } from "./subscriptions.js";
import { createLicenseKeyManagement } from "./licenses.js";
import { createCustomerManagement } from "./customers.js";
import { createWebhookManagement } from "./webhooks.js";
import { createDedupBackend } from "./dedup.js";
import { healthCheck } from "./health.js";
import { createStoreManagement } from "./stores.js";
import { createOrderManagement } from "./orders.js";
import { createDiscountManagement } from "./discounts.js";
import { createCatalogManagement } from "./products-catalog.js";
import { createCheckoutManagement } from "./checkouts-management.js";

export async function createBilling(config: BillingConfig): Promise<Billing> {
  const logger = createLogger(config.logger);

  const doBootstrap = async (): Promise<Awaited<ReturnType<typeof bootstrap>>> => {
    return bootstrap(config);
  };

  const loggedBootstrap = withLogger(logger, "bootstrap", async (_args: Record<string, unknown>) => doBootstrap());
  const { stores, plans: initialPlans, cache } = await loggedBootstrap({});

  let currentPlans = initialPlans;
  const storeId = cache.store.id;

  const rawCreateCheckout = createCheckoutFactory(storeId, config.checkoutExpiresInMs);

  const loggedCheckout = withLogger(
    logger,
    "createCheckout",
    async (args: CheckoutParams & Record<string, unknown>) => rawCreateCheckout(args),
    (url) => ({ checkoutUrl: typeof url === "string" ? `${url.slice(0, 50)}...` : "" })
  );

  const verifyWebhook = config.webhookSecret
    ? createWebhookVerifier(config.webhookSecret)
    : (): boolean => { throw new Error("webhookSecret is required for webhook verification"); };

  const rawHandleWebhook = createWebhookHandler(config.callbacks);

  const loggedHandleWebhook = withLogger(
    logger,
    "handleWebhook",
    async (args: WebhookPayload & Record<string, unknown>) => rawHandleWebhook(args),
    (result) => ({ dispatched: result.dispatched, skipped: result.skipped })
  );

  const refreshPlans = async (): Promise<void> => {
    const products = await fetchProducts(storeId);
    currentPlans = flattenPlans(products);
    writeCache(
      { generatedAt: new Date().toISOString(), store: cache.store, products },
      config.cachePath
    );
  };

  const loggedGetPortal = withLogger(
    logger,
    "getCustomerPortal",
    async (args: { customerId: string } & Record<string, unknown>) => getCustomerPortalUrl(args.customerId),
    (url) => ({ portalUrl: typeof url === "string" ? `${url.slice(0, 50)}...` : "" })
  );

  const subscriptionManagement = createSubscriptionManagement();
  const licenseKeyManagement = createLicenseKeyManagement();
  const customerManagement = createCustomerManagement();
  const webhookManagement = createWebhookManagement(storeId);
  const dedupBackend = createDedupBackend(config.dedup);
  const storeManagement = createStoreManagement();
  const orderManagement = createOrderManagement();
  const discountManagement = createDiscountManagement();
  const catalogManagement = createCatalogManagement();
  const checkoutManagement = createCheckoutManagement();

  const billing: Billing = {
    stores,
    get plans() { return currentPlans; },
    createCheckout: (params: CheckoutParams) =>
      loggedCheckout(params as CheckoutParams & Record<string, unknown>),
    verifyWebhook: (rawBody: string, signature: string) =>
      verifyWebhook(rawBody, signature),
    handleWebhook: async (payload: WebhookPayload) => {
      await loggedHandleWebhook(payload as WebhookPayload & Record<string, unknown>);
    },
    refreshPlans,
    getCustomerPortal: (customerId: string) =>
      loggedGetPortal({ customerId } as { customerId: string } & Record<string, unknown>),
    getExpressRouter: (options: ExpressRouterOptions) => createExpressRouter(
      {
        plans: currentPlans,
        createCheckout: rawCreateCheckout,
        verifyWebhook,
        handleWebhook: rawHandleWebhook,
      },
      options
    ),

    // Subscription Management
    pauseSubscription: subscriptionManagement.pauseSubscription,
    resumeSubscription: subscriptionManagement.resumeSubscription,
    cancelSubscription: subscriptionManagement.cancelSubscription,
    changeSubscriptionVariant: subscriptionManagement.changeSubscriptionVariant,
    resumeCancelledSubscription: subscriptionManagement.resumeCancelledSubscription,
    getSubscription: subscriptionManagement.getSubscription,
    listSubscriptions: subscriptionManagement.listSubscriptions,
    getSubscriptionInvoice: subscriptionManagement.getSubscriptionInvoice,
    listSubscriptionInvoices: subscriptionManagement.listSubscriptionInvoices,
    generateSubscriptionInvoice: subscriptionManagement.generateSubscriptionInvoice,
    issueSubscriptionInvoiceRefund: subscriptionManagement.issueSubscriptionInvoiceRefund,
    getSubscriptionItem: subscriptionManagement.getSubscriptionItem,
    listSubscriptionItems: subscriptionManagement.listSubscriptionItems,
    getSubscriptionItemCurrentUsage: subscriptionManagement.getSubscriptionItemCurrentUsage,
    createUsageRecord: subscriptionManagement.createUsageRecord,
    listUsageRecords: subscriptionManagement.listUsageRecords,

    // License Key Management
    validateLicense: licenseKeyManagement.validateLicense,
    getLicenseDetails: licenseKeyManagement.getLicenseDetails,
    activateLicense: licenseKeyManagement.activateLicense,
    deactivateLicense: licenseKeyManagement.deactivateLicense,
    listLicenseKeys: licenseKeyManagement.listLicenseKeys,
    getLicenseKeyInstance: licenseKeyManagement.getLicenseKeyInstance,
    listLicenseKeyInstances: licenseKeyManagement.listLicenseKeyInstances,
    updateLicenseKey: licenseKeyManagement.updateLicenseKey,

    // Customer Management
    getCustomerByEmail: customerManagement.getCustomerByEmail,
    getSubscriptionsForUser: customerManagement.getSubscriptionsForUser,
    getCustomer: customerManagement.getCustomer,
    createCustomer: customerManagement.createCustomer,
    updateCustomer: customerManagement.updateCustomer,
    archiveCustomer: customerManagement.archiveCustomer,

    // Webhook Management
    createWebhook: webhookManagement.createWebhook,
    deleteWebhook: webhookManagement.deleteWebhook,
    listWebhooks: webhookManagement.listWebhooks,
    getWebhook: webhookManagement.getWebhook,
    updateWebhook: webhookManagement.updateWebhook,

    // Store Management
    getStore: storeManagement.getStore,
    listStores: storeManagement.listStores,
    getAuthenticatedUser: storeManagement.getAuthenticatedUser,

    // Order Management
    getOrder: orderManagement.getOrder,
    listOrders: orderManagement.listOrders,
    generateOrderInvoice: orderManagement.generateOrderInvoice,
    issueOrderRefund: orderManagement.issueOrderRefund,
    getOrderItem: orderManagement.getOrderItem,
    listOrderItems: orderManagement.listOrderItems,

    // Discount Management
    createDiscount: discountManagement.createDiscount,
    deleteDiscount: discountManagement.deleteDiscount,
    getDiscount: discountManagement.getDiscount,
    listDiscounts: discountManagement.listDiscounts,
    getDiscountRedemption: discountManagement.getDiscountRedemption,
    listDiscountRedemptions: discountManagement.listDiscountRedemptions,

    // Catalog Management
    getProduct: catalogManagement.getProduct,
    listProducts: catalogManagement.listProducts,
    getVariant: catalogManagement.getVariant,
    listVariants: catalogManagement.listVariants,
    getPrice: catalogManagement.getPrice,
    listPrices: catalogManagement.listPrices,
    getFile: catalogManagement.getFile,
    listFiles: catalogManagement.listFiles,

    // Checkout Management
    getCheckout: checkoutManagement.getCheckout,
    listCheckouts: checkoutManagement.listCheckouts,

    // Deduplication
    dedupBackend,

    // Health Check
    healthCheck,
  };

  return billing;
}
