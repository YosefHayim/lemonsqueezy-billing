import express from "express";
import { createBilling } from "fresh-squeezy";

const app = express();
const port = process.env.PORT || 3000;

async function setupBilling() {
  try {
    const billing = await createBilling({
      apiKey: process.env.LEMON_SQUEEZY_API_KEY ,
      storeId: "1234567890",
      webhookSecret: "1234567890",
      cachePath: "./cache.json",
      logger: { filePath: "./logs.txt" },
    });
    
    console.log("[+] Billing setup complete!");
    console.log("Available stores:", billing.stores.map(s => s.name));
    console.log("Available plans:", billing.plans.length);
    
    // Example: Create a checkout
    const checkoutUrl = await billing.createCheckout({
      variantId: "1385541",
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
      console.log(`🚀 Server running on port ${port}`);
      console.log("💡 Test your webhook with: curl -X POST http://localhost:${port}/webhook");
    });
    
  } catch (error) {
    console.error("[x] Setup failed:", error);
    process.exit(1);
  }
}

setupBilling();
