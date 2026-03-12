// Global type declarations for Node.js and modules
declare const process: {
  argv: string[];
  cwd: () => string;
  stdout: { write: (s: string) => void };
  exit: (code?: number) => void;
};

declare namespace NodeJS {
  interface Timeout {
    ref(): this;
    unref(): this;
  }
}

import prompts from "prompts";
import chalk from "chalk";
import { createWriteStream } from "node:fs";
import { resolve } from "node:path";
import { createBilling } from "./index.js";
import { fetchStores, fetchProducts, flattenPlans } from "./plans.js";

// Types for prompts
interface PromptState {
  aborted: boolean;
  submitted: boolean;
}

// ASCII Art Banner (no emojis)
const banner = `
${chalk.bold("Lemon Squeezy Billing Setup")}
${"─".repeat(35)}
Quick setup for your billing integration
`;

// Animation helpers - 9 dots snake animation
class LoadingAnimation {
  private interval: ReturnType<typeof setInterval> | null = null;
  private frame = 0;
  private dots = 9;
  private chars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇'];

  start(message: string = "Loading"): void {
    this.stop();
    process.stdout.write(`\n${message} `);
    
    this.interval = setInterval(() => {
      const char = this.chars[this.frame % this.dots];
      const dots = '.'.repeat(this.frame % this.dots);
      const spaces = ' '.repeat(this.dots - (this.frame % this.dots) - 1);
      process.stdout.write(`\r${message} ${char}${dots}${spaces} `);
      this.frame++;
    }, 80);
  }

  stop(message?: string): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    if (message) {
      process.stdout.write(`\r${message}\n`);
    } else {
      process.stdout.write('\n');
    }
  }
}

const loading = new LoadingAnimation();

interface WizardState {
  apiKey: string;
  stores: any[];
  selectedStoreIds: string[];
  products: any[];
  selectedProductIds: string[];
  webhookUrl?: string;
  webhookEvents: string[];
  cachePath: string;
  webhookSecret: string;
  loggerPath: string;
}

class BillingWizard {
  private state: WizardState = {
    apiKey: "",
    stores: [],
    selectedStoreIds: [],
    products: [],
    selectedProductIds: [],
    webhookEvents: [],
    cachePath: "./billing-cache.json",
    webhookSecret: this.generateSecret(),
    loggerPath: "./billing.log",
  };

  private generateSecret(): string {
    return "ls_".concat(Math.random().toString(36).slice(2, 15));
  }

  async run(): Promise<void> {
    console.log(banner);

    try {
      await this.stepApiKey();
      await this.stepStoreSelection();
      await this.stepProductSelection();
      await this.stepWebhookSetup();
      await this.stepConfiguration();
      await this.stepGenerateFiles();
    } catch (error) {
      if (error instanceof Error && error.message === 'Aborted') {
        console.log("\n[x] Wizard cancelled");
        process.exit(0);
      }
      console.error("\n[x] Error:", error);
      process.exit(1);
    }
  }

  private async stepApiKey(): Promise<void> {
    console.log("\n" + chalk.dim("Navigation: ENTER to proceed, ESC to go back/exit"));
    
    const response = await prompts({
      type: "text",
      name: "apiKey",
      message: "Enter your Lemon Squeezy API key:",
      validate: (value: string) => value.length > 0 || "API key is required",
      onState: (state: PromptState) => {
        if (state.aborted) throw new Error('Aborted');
      }
    });

    this.state.apiKey = response.apiKey;

    loading.start("Validating API key");
    
    try {
      // Test the API key by creating a billing instance
      const billing = await createBilling({
        apiKey: this.state.apiKey,
        callbacks: { onPurchase: async () => {} }
      });
      
      loading.stop(`[+] Found ${billing.stores.length} store(s)`);
      this.state.stores = billing.stores;
    } catch (error) {
      loading.stop("[x] Invalid API key. Please try again.");
      return this.stepApiKey();
    }
  }

  private async stepStoreSelection(): Promise<void> {
    console.log("\n" + chalk.dim("Navigation: ENTER to proceed, ESC to go back"));
    if (this.state.stores.length === 0) {
      console.log("[x] No stores found. Please check your API key.");
      return this.stepApiKey();
    }

    const response = await prompts({
      type: "multiselect",
      name: "stores",
      message: "Select stores to use:",
      choices: this.state.stores.map(store => ({
        title: `${store.name} (${store.id})`,
        value: store.id
      })),
      instructions: false,
      hint: "Space to select, Enter to continue",
      onState: (state: PromptState) => {
        if (state.aborted) throw new Error('Aborted');
      }
    });

    this.state.selectedStoreIds = response.stores;

    if (this.state.selectedStoreIds.length === 0) {
      console.log("[x] Please select at least one store");
      return this.stepStoreSelection();
    }

    console.log(`[+] Selected ${this.state.selectedStoreIds.length} store(s)`);
  }

  private async stepProductSelection(): Promise<void> {
    console.log("\n" + chalk.dim("Navigation: ENTER to proceed, ESC to go back"));
    console.log("[*] Fetching products...");

    const allProducts: any[] = [];
    
    for (const storeId of this.state.selectedStoreIds) {
      try {
        const products = await fetchProducts(storeId);
        allProducts.push(...products);
      } catch (error) {
        console.log(`[x] Failed to fetch products for store ${storeId}`);
        return this.stepStoreSelection();
      }
    }

    if (allProducts.length === 0) {
      console.log("[x] No products found. Please create products in your Lemon Squeezy dashboard.");
      return this.stepStoreSelection();
    }

    this.state.products = allProducts;
    const plans = flattenPlans(allProducts);

    const response = await prompts({
      type: "multiselect",
      name: "products",
      message: "Select products to include:",
      choices: plans.map(plan => ({
        title: `${plan.name} - ${plan.variantName} (${plan.priceFormatted})`,
        value: plan.variantId
      })),
      instructions: false,
      hint: "Space to select, Enter to continue",
      onState: (state: PromptState) => {
        if (state.aborted) throw new Error('Aborted');
      }
    });

    this.state.selectedProductIds = response.products;

    if (this.state.selectedProductIds.length === 0) {
      console.log("[x] Please select at least one product");
      return this.stepProductSelection();
    }

    console.log(`[+] Selected ${this.state.selectedProductIds.length} product(s)`);
  }

  private async stepWebhookSetup(): Promise<void> {
    console.log("\n" + chalk.dim("Navigation: ENTER to proceed, ESC to skip"));
    const response = await prompts({
      type: null,
      name: "webhook",
      message: "Create webhook endpoint? (Enter=Yes, ESC=Skip)",
      onState: (state: PromptState) => {
        if (state.aborted) {
          // ESC pressed, skip webhook setup
          return { webhook: false };
        }
        if (state.submitted) {
          return { webhook: true };
        }
      }
    });

    if (!response.webhook) {
      console.log("[-] Skipping webhook setup");
      return;
    }

    const urlResponse = await prompts({
      type: "text",
      name: "url",
      message: "Webhook URL:",
      initial: "https://your-domain.com/webhook",
      validate: (value: string) => value.length > 0 || "URL is required",
      onState: (state: PromptState) => {
        if (state.aborted) throw new Error('Aborted');
      }
    });

    this.state.webhookUrl = urlResponse.url;

    const eventsResponse = await prompts({
      type: "multiselect",
      name: "events",
      message: "Select webhook events:",
      choices: [
        { title: "Order Created", value: "order_created" },
        { title: "Order Refunded", value: "order_refunded" },
        { title: "Subscription Created", value: "subscription_created" },
        { title: "Subscription Updated", value: "subscription_updated" },
        { title: "Subscription Cancelled", value: "subscription_cancelled" },
        { title: "Payment Failed", value: "subscription_payment_failed" },
        { title: "License Key Created", value: "license_key_created" },
        { title: "License Key Updated", value: "license_key_updated" }
      ],
      instructions: false,
      hint: "Space to select, Enter to continue",
      onState: (state: PromptState) => {
        if (state.aborted) throw new Error('Aborted');
      }
    });

    this.state.webhookEvents = eventsResponse.events;

    console.log("[+] Webhook configuration saved");
  }

  private async stepConfiguration(): Promise<void> {
    console.log("\n" + chalk.dim("Navigation: ENTER to proceed, ESC to go back"));
    const cacheResponse = await prompts({
      type: "text",
      name: "cachePath",
      message: "Cache file path:",
      initial: this.state.cachePath,
      onState: (state: PromptState) => {
        if (state.aborted) throw new Error('Aborted');
      }
    });

    this.state.cachePath = cacheResponse.cachePath || this.state.cachePath;

    const secretResponse = await prompts({
      type: "text",
      name: "webhookSecret",
      message: "Webhook secret:",
      initial: this.state.webhookSecret,
      onState: (state: PromptState) => {
        if (state.aborted) throw new Error('Aborted');
      }
    });

    this.state.webhookSecret = secretResponse.webhookSecret || this.state.webhookSecret;

    const loggerResponse = await prompts({
      type: "text",
      name: "loggerPath",
      message: "Logger file path:",
      initial: this.state.loggerPath,
      onState: (state: PromptState) => {
        if (state.aborted) throw new Error('Aborted');
      }
    });

    this.state.loggerPath = loggerResponse.loggerPath || this.state.loggerPath;

    console.log("[+] Configuration saved");
  }

  private async stepGenerateFiles(): Promise<void> {
    console.log("\n" + chalk.dim("Navigation: ENTER to generate, ESC to exit"));
    const response = await prompts({
      type: null,
      name: "generate",
      message: "Generate configuration files? (Enter=Yes, ESC=Exit)",
      onState: (state: PromptState) => {
        if (state.aborted) throw new Error('Aborted');
        if (state.submitted) {
          return { generate: true };
        }
      }
    });

    if (!response.generate) {
      console.log("[-] Exiting without generating files");
      process.exit(0);
    }

    await this.generateFiles();
  }

  private async generateFiles(): Promise<void> {
    const configContent = this.generateConfigContent();
    const exampleContent = this.generateExampleContent();

    const configPath = resolve(process.cwd(), "billing-config.ts");
    const examplePath = resolve(process.cwd(), "example.ts");

    // Write config file
    const configStream = createWriteStream(configPath);
    configStream.write(configContent);
    configStream.end();

    // Write example file
    const exampleStream = createWriteStream(examplePath);
    exampleStream.write(exampleContent);
    exampleStream.end();

    console.log("\n[+] Files generated successfully!");
    console.log(`📁 ${configPath}`);
    console.log(`📁 ${examplePath}`);
    
    console.log("\n🚀 Next steps:");
    console.log("1. Review the generated files");
    console.log("2. Run: node example.ts");
    console.log("3. Start building your billing integration!");
  }

  private generateConfigContent(): string {
    return `import type { BillingConfig } from "@yosefhayim/lemonsqueezy-billing";

export const billingConfig: BillingConfig = {
  apiKey: process.env.LEMON_SQUEEZY_API_KEY || "${this.state.apiKey}",
  storeId: "${this.state.selectedStoreIds[0]}",
  webhookSecret: "${this.state.webhookSecret}",
  cachePath: "${this.state.cachePath}",
  logger: { filePath: "${this.state.loggerPath}" },
  callbacks: {
    onPurchase: async (event) => {
      // Handle purchase event
      console.log("Purchase:", event);
      // TODO: Add your purchase logic here
    },
    onRefund: async (event) => {
      // Handle refund event
      console.log("Refund:", event);
      // TODO: Add your refund logic here
    },
    onSubscriptionCreated: async (event) => {
      // Handle subscription created
      console.log("Subscription created:", event);
      // TODO: Add your subscription created logic here
    },
    onSubscriptionUpdated: async (event) => {
      // Handle subscription updated
      console.log("Subscription updated:", event);
      // TODO: Add your subscription updated logic here
    },
    onSubscriptionCancelled: async (event) => {
      // Handle subscription cancelled
      console.log("Subscription cancelled:", event);
      // TODO: Add your subscription cancelled logic here
    },
    onPaymentFailed: async (event) => {
      // Handle payment failed
      console.log("Payment failed:", event);
      // TODO: Add your payment failed logic here
    },
    onLicenseKeyCreated: async (event) => {
      // Handle license key created
      console.log("License key created:", event);
      // TODO: Add your license key created logic here
    },
    onLicenseKeyUpdated: async (event) => {
      // Handle license key updated
      console.log("License key updated:", event);
      // TODO: Add your license key updated logic here
    }
  }
};

${this.state.webhookUrl ? `
// Webhook configuration
export const webhookConfig = {
  url: "${this.state.webhookUrl}",
  events: [${this.state.webhookEvents.map(e => `"${e}"`).join(", ")}],
  secret: "${this.state.webhookSecret}"
};
` : ""}
`;
  }

  private generateExampleContent(): string {
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
      variantId: "${this.state.selectedProductIds[0] || "your-variant-id"}",
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
}

// Run the wizard
// Check if this file is being run directly (works in both CJS and ESM)
const isMain = globalThis.process?.argv[1]?.endsWith('wizard.ts');
if (isMain) {
  const wizard = new BillingWizard();
  wizard.run().catch(console.error);
}

export { BillingWizard };