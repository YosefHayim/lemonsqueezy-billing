import { WizardState } from "@wizard/types.js";

export function generateConfigContent(state: WizardState): string {
  return `import type { BillingConfig, PurchaseEvent, RefundEvent, SubscriptionEvent, PaymentFailedEvent, LicenseKeyEvent, SubscriptionPausedEvent, SubscriptionResumedEvent, SubscriptionPaymentSuccessEvent, SubscriptionPaymentRecoveredEvent } from "./types";

export const billingConfig: BillingConfig = {
  apiKey: process.env.LEMON_SQUEEZY_API_KEY || "${state.apiKey}",
  storeId: "${state.selectedStoreIds[0]}",
  webhookSecret: "${state.webhookSecret}",
  cachePath: "${state.cachePath}",
  logger: { filePath: "${state.loggerPath}" },
  callbacks: {
    onPurchase: async (event: PurchaseEvent) => {
      // Handle purchase event
      console.log("Purchase:", event);
      // Add your purchase logic here
    },
    onRefund: async (event: RefundEvent) => {
      // Handle refund event
      console.log("Refund:", event);
      // Add your refund logic here
    },
    onSubscriptionCreated: async (event: SubscriptionEvent) => {
      // Handle subscription created
      console.log("Subscription created:", event);
      // Add your subscription created logic here
    },
    onSubscriptionUpdated: async (event: SubscriptionEvent) => {
      // Handle subscription updated
      console.log("Subscription updated:", event);
      // Add your subscription updated logic here
    },
    onSubscriptionCancelled: async (event: SubscriptionEvent) => {
      // Handle subscription cancelled
      console.log("Subscription cancelled:", event);
      // Add your subscription cancelled logic here
    },
    onPaymentFailed: async (event: PaymentFailedEvent) => {
      // Handle payment failed
      console.log("Payment failed:", event);
      // Add your payment failed logic here
    },
    onSubscriptionPaused: async (event: SubscriptionPausedEvent) => {
      // Handle subscription paused
      console.log("Subscription paused:", event);
      // Add your subscription paused logic here
    },
    onSubscriptionResumed: async (event: SubscriptionResumedEvent) => {
      // Handle subscription resumed
      console.log("Subscription resumed:", event);
      // Add your subscription resumed logic here
    },
    onSubscriptionPaymentSuccess: async (event: SubscriptionPaymentSuccessEvent) => {
      // Handle subscription payment success
      console.log("Subscription payment success:", event);
      // Add your subscription payment success logic here
    },
    onSubscriptionPaymentRecovered: async (event: SubscriptionPaymentRecoveredEvent) => {
      // Handle subscription payment recovered
      console.log("Subscription payment recovered:", event);
      // Add your subscription payment recovered logic here
    },
    onLicenseKey: async (method: string, event: LicenseKeyEvent) => {
      // Handle license key events
      console.log("License key " + method + ":", event);
      // Add your license key logic here
    }
  }
};

${state.webhookUrl ? `
// Webhook configuration
export const webhookConfig = {
  url: "${state.webhookUrl}",
  events: [${state.webhookEvents.map(e => `"${e}"`).join(", ")}],
  secret: "${state.webhookSecret}"
};
` : ""}
`;
}

export function generateExampleContent(state: WizardState): string {
  return `import express from "express";
import { createBilling } from "@yosefhayim/lemonsqueezy-billing";
import { billingConfig } from "./billing-config";

const app = express();
const port = process.env.PORT || 3000;

async function setupBilling() {
  try {
    const billing = await createBilling(billingConfig);
    
    console.log("[+] Billing setup complete!");
    console.log("Available stores:", billing.stores.map(s => s.name));
    console.log("Available plans:", billing.plans.length);
    
    // Example: Create a checkout
    const checkoutUrl = await billing.createCheckout({
      variantId: "${state.selectedProductIds[0] || "your-variant-id"}",
      email: "user@example.com",
      userId: "user-123"
    });
    
    console.log("Checkout URL:", checkoutUrl);
    
    // Webhook endpoint
    app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
      const signature = req.headers["x-signature"] as string;
      const rawBody = req.body.toString();
      
      if (!billing.verifyWebhook(rawBody, signature)) {
        return res.status(401).send("Invalid signature");
      }
      
      await billing.handleWebhook(JSON.parse(rawBody));
      res.json({ received: true });
    });
    
    app.listen(port, () => {
      console.log(\`🚀 Server running on port \${port}\`);
      console.log("💡 Test your webhook with: curl -X POST http://localhost:\${port}/webhook");
    });
    
  } catch (error) {
    console.error("[x] Setup failed:", error);
    process.exit(1);
  }
}

setupBilling();
`;
}