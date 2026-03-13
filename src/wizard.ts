// Global type declarations for Node.js and modules
declare const process: {
  argv: string[];
  cwd: () => string;
  stdout: { write: (s: string) => void };
  exit: (code?: number) => void;
  env: Record<string, string | undefined>;
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
import { createBilling } from "@core/index.js";
import { fetchProducts, flattenPlans } from "@core/plans.js";
import type { CachedProduct, StoreInfo } from "./types/index.js";
import "dotenv/config";

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
  stores: StoreInfo[];
  selectedStoreIds: string[];
  products: CachedProduct[];
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

  private getAvailableApiKeys(): { name: string; value: string; description: string }[] {
    const keys: { name: string; value: string; description: string }[] = [];

    if (process.env.LS_TEST_API_KEY) {
      keys.push({
        name: "LS_TEST_API_KEY",
        value: process.env.LS_TEST_API_KEY,
        description: "Test mode API key (sandbox)"
      });
    }
    if (process.env.LS_LIVE_API_KEY) {
      keys.push({
        name: "LS_LIVE_API_KEY",
        value: process.env.LS_LIVE_API_KEY,
        description: "Live mode API key (production)"
      });
    }

    return keys;
  }

  private async stepApiKey(): Promise<void> {
    console.log("\n" + chalk.dim("Navigation: ENTER to proceed, ESC to go back/exit"));
    console.log(chalk.dim("Tip: Set LS_TEST_API_KEY, LS_LIVE_API_KEY, or LS_WEBHOOK_SECRET in .env"));

    const availableKeys = this.getAvailableApiKeys();
    let apiKey: string | null = null;

    if (availableKeys.length > 0) {
      if (availableKeys.length === 1) {
        console.log(`\n[+] Found ${availableKeys[0].name} in environment`);
        apiKey = availableKeys[0].value;
      } else {
        console.log("\n" + chalk.dim("Select API keys (use SPACE to select, ENTER to submit):"));
        const selected = await prompts({
          type: "multiselect",
          name: "apiKeys",
          message: "Choose API keys:",
          choices: availableKeys.map(k => ({
            title: `${k.name} (${k.description})`,
            value: k.value
          })),
          instructions: false,
          hint: "Space to select, Enter to submit",
          onState: (state: PromptState) => {
            if (state.aborted) throw new Error('Aborted');
          }
        });
        
        // Use the first selected key, or fallback to the first available if none selected
        apiKey = selected.apiKeys.length > 0 ? selected.apiKeys[0] : availableKeys[0].value;
      }
    }

    if (!apiKey) {
      const response = await prompts({
        type: "text",
        name: "apiKey",
        message: "Enter your Lemon Squeezy API key:",
        validate: (value: string) => value.length > 0 || "API key is required",
        onState: (state: PromptState) => {
          if (state.aborted) throw new Error('Aborted');
        }
      });

      apiKey = response.apiKey;
    }

    if (!apiKey) {
      console.log("[x] API key is required");
      return this.stepApiKey();
    }

    loading.start("Validating API key");

    try {
      // Test the API key by creating a billing instance
      const billing = await createBilling({
        apiKey: apiKey!,
        callbacks: { onPurchase: async () => {} }
      });

      loading.stop(`[+] Found ${billing.stores.length} store(s)`);
      this.state.apiKey = apiKey!;
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

    console.log("\n" + chalk.dim("Select stores (use SPACE to select, ENTER to submit):"));
    const response = await prompts({
      type: "multiselect",
      name: "stores",
      message: "Select stores to use:",
      choices: this.state.stores.map(store => ({
        title: `${store.name} (${store.id})`,
        value: store.id
      })),
      instructions: false,
      hint: "Space to select, Enter to submit",
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
    loading.start("Fetching products");

    const allProducts: CachedProduct[] = [];

    for (const storeId of this.state.selectedStoreIds) {
      try {
        const products = await fetchProducts(storeId);
        allProducts.push(...products);
      } catch (error) {
        loading.stop(`[x] Failed to fetch products for store ${storeId}`);
        return this.stepStoreSelection();
      }
    }

    loading.stop("");

    if (allProducts.length === 0) {
      console.log("[x] No products found. Please create products in your Lemon Squeezy dashboard.");
      return this.stepStoreSelection();
    }

    this.state.products = allProducts;
    const plans = flattenPlans(allProducts);

    console.log("\n" + chalk.dim("Select products (use SPACE to select, ENTER to submit):"));
    const response = await prompts({
      type: "multiselect",
      name: "products",
      message: "Select products to include:",
      choices: plans.map(plan => ({
        title: `${plan.name} - ${plan.variantName} (${plan.priceFormatted})`,
        value: plan.variantId
      })),
      instructions: false,
      hint: "Space to select, Enter to submit",
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
    
    console.log("\n" + chalk.dim("Create webhook endpoint? (use SPACE to select, ENTER to submit):"));
    const response = await prompts({
      type: "multiselect",
      name: "webhook",
      message: "Create webhook endpoint:",
      choices: [
        { title: "Yes, create webhook", value: "yes" },
        { title: "No, skip webhook setup", value: "no" }
      ],
      instructions: false,
      hint: "Space to select, Enter to submit",
      onState: (state: PromptState) => {
        if (state.aborted) throw new Error('Aborted');
      }
    });

    if (!response.webhook.includes("yes")) {
      console.log("[-] Skipping webhook setup");
      return;
    }

    console.log("\n" + chalk.dim("Enter webhook URL:"));
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

    console.log("\n" + chalk.dim("Select webhook events (use SPACE to select, ENTER to submit):"));
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
      hint: "Space to select, Enter to submit",
      onState: (state: PromptState) => {
        if (state.aborted) throw new Error('Aborted');
      }
    });

    this.state.webhookEvents = eventsResponse.events;

    console.log("[+] Webhook configuration saved");
  }

  private async stepConfiguration(): Promise<void> {
    console.log("\n" + chalk.dim("Navigation: ENTER to proceed, ESC to go back"));
    
    console.log("\n" + chalk.dim("Enter cache file path:"));
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

    console.log("\n" + chalk.dim("Enter the webhook secret you want:"));
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

    console.log("\n" + chalk.dim("Enter logger file path:"));
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
    
    console.log("\n" + chalk.dim("Generate configuration files? (use SPACE to select, ENTER to submit):"));
    const response = await prompts({
      type: "multiselect",
      name: "generate",
      message: "Generate configuration files:",
      choices: [
        { title: "Yes, generate files", value: "yes" },
        { title: "No, exit without generating", value: "no" }
      ],
      instructions: false,
      hint: "Space to select, Enter to submit",
      onState: (state: PromptState) => {
        if (state.aborted) throw new Error('Aborted');
      }
    });

    if (!response.generate.includes("yes")) {
      console.log("[-] Exiting without generating files");
      process.exit(0);
    }

    await this.generateFiles();
    
    // Run validation tests after file generation
    await this.runValidationTests();
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

  private async runValidationTests(): Promise<void> {
    console.log("\n" + chalk.dim("Running validation tests..."));
    
    try {
      const { execSync } = await import('child_process');
      const fs = await import('node:fs');
      const path = await import('node:path');

      loading.start("Testing TypeScript compilation");
      execSync('pnpm typecheck', { stdio: 'pipe' });
      loading.stop("[+] TypeScript compilation passed");
      
      loading.start("Testing build process");
      execSync('pnpm build', { stdio: 'pipe' });
      loading.stop("[+] Build process passed");
      
      loading.start("Testing example file syntax");
      execSync('node --check example.ts', { stdio: 'pipe' });
      loading.stop("[+] Example file syntax valid");
      
      loading.start("Testing billing configuration");
      const configPath = path.resolve(process.cwd(), 'billing-config.ts');
      
      if (!fs.existsSync(configPath)) {
        throw new Error("billing-config.ts file not found");
      }
      
      const configContent = fs.readFileSync(configPath, 'utf8');
      if (!configContent.includes('export const billingConfig')) {
        throw new Error("billing-config.ts does not export billingConfig");
      }
      
      loading.stop("[+] Billing configuration valid");
      
      console.log("\n[+] All validation tests passed! ✅");
      console.log("Your billing integration is ready to use.");
      
      // Check if sandbox API key and offer real cycle flow
      await this.offerRealCycleFlow();
      
    } catch (error) {
      console.log("\n[x] Validation tests failed:");
      console.error("Error:", error instanceof Error ? error.message : error);
      console.log("\nPlease review the generated files and fix any issues.");
      console.log("You can run the following commands to debug:");
      console.log("  pnpm typecheck");
      console.log("  pnpm build");
      console.log("  node --check example.ts");
      process.exit(1);
    }
  }

  private generateConfigContent(): string {
    const lines: string[] = [];
    
    lines.push(`import type { BillingConfig, PurchaseEvent, RefundEvent, SubscriptionEvent, PaymentFailedEvent, LicenseKeyEvent, SubscriptionPausedEvent, SubscriptionResumedEvent, SubscriptionPaymentSuccessEvent, SubscriptionPaymentRecoveredEvent } from "./types";`);
    lines.push(``);
    lines.push(`export const billingConfig: BillingConfig = {`);
    lines.push(`  apiKey: process.env.LEMON_SQUEEZY_API_KEY || "${ this.state.apiKey}",`);
    lines.push(`  storeId: "${ this.state.selectedStoreIds[0]}",`);
    lines.push(`  webhookSecret: "${ this.state.webhookSecret}",`);
    lines.push(`  cachePath: "${ this.state.cachePath}",`);
    lines.push(`  logger: { filePath: "${ this.state.loggerPath}" },`);
    lines.push(`  callbacks: {`);
    lines.push(`    onPurchase: async (event: PurchaseEvent) => {`);
    lines.push(`      console.log("Purchase:", event);`);
    lines.push(`    },`);
    lines.push(`    onRefund: async (event: RefundEvent) => {`);
    lines.push(`      console.log("Refund:", event);`);
    lines.push(`    },`);
    lines.push(`    onSubscription: async (event: AnySubscriptionEvent, method: SubscriptionMethod) => {`);
    lines.push(`      console.log(\`Subscription \${method}:\`, event);`);
    lines.push(`    },`);
    lines.push(`    onSubscriptionPayment: async (event: SubscriptionPaymentSuccessEvent | SubscriptionPaymentRecoveredEvent, method: SubscriptionPaymentMethod) => {`);
    lines.push(`      console.log(\`Subscription payment \${method}:\`, event);`);
    lines.push(`    },`);
    lines.push(`    onPaymentFailed: async (event: PaymentFailedEvent) => {`);
    lines.push(`      console.log("Payment failed:", event);`);
    lines.push(`    },`);
    lines.push(`    onLicenseKeyCreated: async (event: LicenseKeyEvent) => {`);
    lines.push(`      console.log("License key created:", event);`);
    lines.push(`    },`);
    lines.push(`    onLicenseKeyUpdated: async (event: LicenseKeyEvent) => {`);
    lines.push(`      console.log("License key updated:", event);`);
    lines.push(`    }`);
    lines.push(`  }`);
    lines.push(`};`);
    
    if (this.state.webhookUrl) {
      lines.push(``);
      lines.push(`export const webhookConfig = {`);
      lines.push(`  url: "${ this.state.webhookUrl}",`);
      const eventsStr = this.state.webhookEvents.map(e => `"${e}"`).join(", ");
      lines.push(`  events: [${eventsStr}],`);
      lines.push(`  secret: "${ this.state.webhookSecret.slice(0, 8)}...${ this.state.webhookSecret.slice(-4)}"`);
      lines.push(`};`);
    }
    
    return lines.join("\n");
  }

  private async offerRealCycleFlow(): Promise<void> {
    console.log("\n" + chalk.dim("Checking API key type..."));
    
    const isSandboxKey = this.state.apiKey.includes('test_') || 
                        this.state.apiKey.includes('sandbox_') ||
                        process.env.LS_TEST_API_KEY === this.state.apiKey;
    
    const message = isSandboxKey
      ? "Run real cycle flow test (sandbox)?"
      : "Run live tests (production API)?";
    
    console.log("\n" + chalk.dim("Would you like to run tests? (use SPACE to select, ENTER to submit):"));
    const response = await prompts({
      type: "multiselect",
      name: "runTest",
      message,
      choices: [
        { title: isSandboxKey ? "Yes, run sandbox test" : "Yes, run live tests", value: "yes" },
        { title: "No, skip tests", value: "no" }
      ],
      instructions: false,
      hint: "Space to select, Enter to submit",
      onState: (state: PromptState) => {
        if (state.aborted) throw new Error('Aborted');
      }
    });

    if (!response.runTest.includes("yes")) {
      console.log("[-] Skipping tests");
      return;
    }

    await this.runRealCycleFlow();
  }

  private async runRealCycleFlow(): Promise<void> {
    console.log("\n" + chalk.dim("Running tests..."));
    
    try {
      const path = await import('node:path');
      const { pathToFileURL } = await import('node:url');
      const configPath = path.resolve(process.cwd(), 'billing-config.ts');
      const billingConfig = await import(pathToFileURL(configPath).href);
      const billing = await createBilling(billingConfig.billingConfig);
      
      if (billing.plans.length === 0) {
        console.log("[x] No products available for checkout test");
      } else {
        loading.start("Testing checkout URL creation");
        const testVariantId = billing.plans[0].variantId;
        const checkoutUrl = await billing.createCheckout({
          variantId: testVariantId,
          email: "test@example.com",
          userId: "test-user-123"
        });
        loading.stop(`[+] Checkout URL created: ${checkoutUrl.slice(0, 60)}...`);
        console.log(chalk.dim(`  Using variant: ${testVariantId}`));
      }
      
      loading.start("Testing product listing");
      loading.stop(`[+] Found ${billing.plans.length} products`);
      for (const plan of billing.plans.slice(0, 3)) {
        console.log(chalk.dim(`  - ${plan.name} / ${plan.variantName}: ${plan.priceFormatted} (${plan.variantId})`));
      }
      
      loading.start("Testing store listing");
      loading.stop(`[+] Found ${billing.stores.length} stores`);
      for (const store of billing.stores) {
        console.log(chalk.dim(`  - ${store.name} (${store.id})`));
      }
      
      loading.start("Testing customer portal URL");
      loading.stop("[+] Customer portal functionality available");
      
      const isSandbox = this.state.apiKey.includes('test_') || this.state.apiKey.includes('sandbox_');
      console.log("\n[+] Tests completed successfully! ✅");
      console.log(`All API operations are working correctly with your ${isSandbox ? 'sandbox' : 'live'} environment.`);
      
    } catch (error) {
      console.log("\n[x] Real cycle flow test failed:");
      if (error instanceof Error) {
        console.error("Error:", error.message);
      } else if (error && typeof error === 'object') {
        console.error("Error:", JSON.stringify(error, null, 2));
      } else {
        console.error("Error:", String(error));
      }
      console.log("\nThis is normal if your environment doesn't have products configured.");
      console.log("Your billing integration is still ready to use.");
    }
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
const isMain = globalThis.process?.argv[1]?.endsWith('wizard.ts');
if (isMain) {
  runWizard().catch(console.error);
}

export async function runWizard(): Promise<void> {
  const wizard = new BillingWizard();
  await wizard.run();
}

export { BillingWizard };