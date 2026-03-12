import { createBilling } from "@yosefhayim/lemonsqueezy-billing";
import { billingConfig } from "./billing-config.ts";

async function main() {
  const billing = await createBilling(billingConfig);

  console.log("[+] Billing setup complete!");
  console.log("Available stores:", billing.stores.map((s: any) => s.name));
  console.log("Available plans:", billing.plans.length);

  // Example: Create a checkout
  const url = await billing.createCheckout({
    variantId: billing.plans[0]?.variantId || "your-variant-id",
    email: "user@example.com",
    userId: "user-123",
  });

  console.log("Checkout URL:", url);

  // Example webhook endpoint (Express)
  // app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  //   const signature = req.headers["x-signature"];
  //   const rawBody = req.body.toString();
  //
  //   if (!billing.verifyWebhook(rawBody, signature)) {
  //     return res.status(401).send("Invalid signature");
  //   }
  //
  //   await billing.handleWebhook(JSON.parse(rawBody));
  //   res.json({ received: true });
  // });
}

main().catch(console.error);
