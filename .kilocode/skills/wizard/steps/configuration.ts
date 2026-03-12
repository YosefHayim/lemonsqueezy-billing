import prompts from "prompts";
import chalk from "chalk";
import { WizardState, PromptState } from "@wizard/types.js";

export async function stepConfiguration(state: WizardState): Promise<void> {
  console.log("\n" + chalk.dim("Navigation: ENTER to proceed, ESC to go back"));
  
  console.log("\n" + chalk.dim("Enter cache file path:"));
  const cacheResponse = await prompts({
    type: "text",
    name: "cachePath",
    message: "Cache file path:",
    initial: state.cachePath,
    onState: (state: PromptState) => {
      if (state.aborted) throw new Error('Aborted');
    }
  });

  state.cachePath = cacheResponse.cachePath || state.cachePath;

  console.log("\n" + chalk.dim("Enter the webhook secret you want:"));
  const secretResponse = await prompts({
    type: "text",
    name: "webhookSecret",
    message: "Webhook secret:",
    initial: state.webhookSecret,
    onState: (state: PromptState) => {
      if (state.aborted) throw new Error('Aborted');
    }
  });

  state.webhookSecret = secretResponse.webhookSecret || state.webhookSecret;

  console.log("\n" + chalk.dim("Enter logger file path:"));
  const loggerResponse = await prompts({
    type: "text",
    name: "loggerPath",
    message: "Logger file path:",
    initial: state.loggerPath,
    onState: (state: PromptState) => {
      if (state.aborted) throw new Error('Aborted');
    }
  });

  state.loggerPath = loggerResponse.loggerPath || state.loggerPath;

  console.log("[+] Configuration saved");
}