import prompts from "prompts";
import chalk from "chalk";
import { WizardState } from "@wizard/types.js";
import { banner } from "@wizard/components/banner.js";
import { stepApiKey } from "@wizard/steps/api-key.js";
import { stepStoreSelection } from "@wizard/steps/store-selection.js";
import { stepProductSelection } from "@wizard/steps/product-selection.js";
import { stepWebhookSetup } from "@wizard/steps/webhook-setup.js";
import { stepConfiguration } from "@wizard/steps/configuration.js";
import { stepGenerateFiles } from "@wizard/steps/generate-files.js";

// Generate a random webhook secret
function generateSecret(): string {
  return "ls_".concat(Math.random().toString(36).slice(2, 15));
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
    webhookSecret: generateSecret(),
    loggerPath: "./billing.log",
  };

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
    return stepApiKey(this.state);
  }

  private async stepStoreSelection(): Promise<void> {
    return stepStoreSelection(this.state);
  }

  private async stepProductSelection(): Promise<void> {
    return stepProductSelection(this.state);
  }

  private async stepWebhookSetup(): Promise<void> {
    return stepWebhookSetup(this.state);
  }

  private async stepConfiguration(): Promise<void> {
    return stepConfiguration(this.state);
  }

  private async stepGenerateFiles(): Promise<void> {
    return stepGenerateFiles(this.state);
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