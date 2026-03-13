#!/usr/bin/env node

import { runWizard } from "../wizard.js";
import { runValidate } from "./cli-validate.js";

type Command = "wizard" | "validate" | "help";

function printHelp(): void {
  console.log(`
Lemon Squeezy Billing CLI

Usage: lemonsqueezy-billing <command>

Commands:
  wizard     Run interactive setup wizard
  validate  Validate billing configuration
  help      Show this help message

Examples:
  npx lemonsqueezy-billing wizard
  npx lemonsqueezy-billing validate
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command: Command = (args[0] as Command) || "help";

  switch (command) {
    case "wizard":
      await runWizard();
      break;
    case "validate":
      await runValidate();
      break;
    case "help":
    default:
      printHelp();
      process.exit(command === "help" ? 0 : 1);
  }
}

main().catch((error: Error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
