import prompts from "prompts";
import chalk from "chalk";
import { createBilling } from "@core/index.js";
import { WizardState, AvailableApiKey } from "../types.js";
import { loading } from "@wizard/components/loading.js";

export async function stepApiKey(state: WizardState): Promise<void> {
  console.log("\n" + chalk.dim("Navigation: ENTER to proceed, ESC to go back/exit"));
  loading.start("Tip: Set LS_TEST_API_KEY, LS_LIVE_API_KEY, or LS_WEBHOOK_SECRET in .env");

  const availableKeys = getAvailableApiKeys();
  let apiKey: string | null = null;

  if (availableKeys.length > 0) {
    if (availableKeys.length === 1) {
      loading.stop(`[+] Found ${availableKeys[0].name} in environment`);
      apiKey = availableKeys[0].value;
    } else {
      console.log("\n" + chalk.dim("Select API keys (use SPACE to select, ENTER to submit):"));
      const selected = await prompts({
        type: "multiselect",
        name: "apiKeys",
        message: "",
        choices: availableKeys.map(k => ({
          title: k.name === "LS_TEST_API_KEY" 
            ? `${chalk.cyan("Sandbox API Key")} ${chalk.green("✓")} (${k.description})`
            : `${chalk.green("Production API Key")} ${chalk.green("✓")} (${k.description})`,
          value: k.value
        })),
        instructions: false,
        hint: "Space to select, Enter to submit",
        onState: (state: any) => {
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
      onState: (state: any) => {
        if (state.aborted) throw new Error('Aborted');
      }
    });

    apiKey = response.apiKey;
  }

  if (!apiKey) {
    console.log("[x] API key is required");
    return stepApiKey(state);
  }

  loading.start("Validating API key");

  try {
    // Test the API key by creating a billing instance
    const billing = await createBilling({
      apiKey: apiKey!,
      callbacks: { onPurchase: async () => {} }
    });

    loading.stop(`[+] Found ${billing.stores.length} store(s)`);
    state.apiKey = apiKey!;
    state.stores = billing.stores;
  } catch (error) {
    loading.stop("[x] Invalid API key. Please try again.");
    return stepApiKey(state);
  }
}

function getAvailableApiKeys(): AvailableApiKey[] {
  const keys: AvailableApiKey[] = [];

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