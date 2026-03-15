import express from "express";
import { createBilling } from "fresh-squeezy";

const app = express();
const port = process.env.PORT || 3000;

async function setupBilling() {
  try {
    const billing = await createBilling({
      apiKey: process.env.LS_API_KEY ?? "",
      webhookSecret: process.env.LS_WEBHOOK_SECRET ?? "",
      callbacks: {
        onOrder: async (event, method) => {
          if (method === "purchase") console.log("[+] Purchase:", event.orderId, event.email);
          if (method === "refund")   console.log("[-] Refund:", event.orderId);
        },
        onSubscription: async (event, method) => {
          console.log(`[~] Subscription ${method}:`, event);
        },
        onLicenseKey: async (event, method) => {
          console.log(`[K] License ${method}:`, event.key);
        },
      },
    });

    console.log("[+] Billing setup complete!");
    console.log("Available stores:", billing.stores.map(s => s.name));
    console.log("Available plans:", billing.plans.length);

    const checkoutUrl = await billing.createCheckout({
      variantId: billing.plans[0]?.variantId ?? "your-variant-id",
      email: "user@example.com",
      userId: "user-123",
    });

    console.log("Checkout URL:", checkoutUrl);

    app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
      const signature = req.headers["x-signature"] as string;
      if (!req.body || !signature) {
        return res.status(400).send("Missing body or signature");
      }
      const rawBody = req.body.toString();

      if (!billing.verifyWebhook(rawBody, signature)) {
        return res.status(401).send("Invalid signature");
      }

      await billing.handleWebhook(JSON.parse(rawBody));
      res.json({ received: true });
    });

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("[x] Setup failed:", error);
    process.exit(1);
  }
}

setupBilling();
