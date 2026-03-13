#!/usr/bin/env tsx

import { loadEnv, getApiKey, confirmBeforeLive, cleanupFiles, logPhaseStart, logPhaseEnd } from "./cli-test/shared.js";
import { runOfflineTests } from "./cli-test/offline.js";
import { runLiveTests } from "./cli-test/live.js";
import { runWebhookTests } from "./cli-test/webhooks.js";

interface CliArgs {
  sandbox: boolean;
  live: boolean;
  yes: boolean;
  e2e: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = {
    sandbox: false,
    live: false,
    yes: false,
    e2e: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--sandbox":
        result.sandbox = true;
        break;
      case "--live":
        result.live = true;
        break;
      case "--yes":
      case "--no-confirm":
        result.yes = true;
        break;
      case "--e2e":
        result.e2e = true;
        break;
      default:
        if (arg.startsWith("-")) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }
  }

  return result;
}

async function main() {
  console.log("🍋 lemonsqueezy-billing — CLI Test Suite\n");
  console.log("=".repeat(50));

  const args = parseArgs();
  const env = loadEnv();

  // Determine mode
  let mode: "sandbox" | "live" | "both" | "offline";
  const hasSandboxKey = !!env.LS_TEST_API_KEY;
  const hasLiveKey = !!env.LS_LIVE_API_KEY;
  
  if (args.sandbox) {
    mode = "sandbox";
  } else if (args.live) {
    mode = "live";
  } else {
    console.log("\nWhich mode do you want to run real API tests against?");
    
    if (hasSandboxKey && hasLiveKey) {
      console.log("1) Sandbox (test mode)");
      console.log("2) Live (production)");
      console.log("3) Both (Sandbox then Live)");
      console.log("4) Offline only (no API key needed)");
      console.log("5) Cancel");
      
      const readline = await import("readline");
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise<string>((resolve) => {
        rl.question("> ", (input) => {
          rl.close();
          resolve(input.trim());
        });
      });
      
      if (answer === "1" || answer.toLowerCase() === "sandbox") {
        mode = "sandbox";
      } else if (answer === "2" || answer.toLowerCase() === "live") {
        mode = "live";
      } else if (answer === "3" || answer.toLowerCase() === "both") {
        mode = "both";
      } else if (answer === "4" || answer.toLowerCase() === "offline") {
        mode = "offline";
      } else {
        console.log("\nCancelled.");
        process.exit(0);
      }
    } else if (hasSandboxKey) {
      console.log("1) Sandbox (test mode)");
      console.log("2) Offline only (no API key needed)");
      console.log("3) Cancel");
      
      const readline = await import("readline");
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise<string>((resolve) => {
        rl.question("> ", (input) => {
          rl.close();
          resolve(input.trim());
        });
      });
      
      if (answer === "1" || answer.toLowerCase() === "sandbox") {
        mode = "sandbox";
      } else if (answer === "2" || answer.toLowerCase() === "offline") {
        mode = "offline";
      } else {
        console.log("\nCancelled.");
        process.exit(0);
      }
    } else if (hasLiveKey) {
      console.log("1) Live (production)");
      console.log("2) Offline only (no API key needed)");
      console.log("3) Cancel");
      
      const readline = await import("readline");
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise<string>((resolve) => {
        rl.question("> ", (input) => {
          rl.close();
          resolve(input.trim());
        });
      });
      
      if (answer === "1" || answer.toLowerCase() === "live") {
        mode = "live";
      } else if (answer === "2" || answer.toLowerCase() === "offline") {
        mode = "offline";
      } else {
        console.log("\nCancelled.");
        process.exit(0);
      }
    } else {
      console.log("1) Offline only (no API key needed)");
      console.log("2) Cancel");
      
      const readline = await import("readline");
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise<string>((resolve) => {
        rl.question("> ", (input) => {
          rl.close();
          resolve(input.trim());
        });
      });
      
      if (answer === "1" || answer.toLowerCase() === "offline") {
        mode = "offline";
      } else {
        console.log("\nCancelled.");
        process.exit(0);
      }
    }
  }

  // Get API key (only needed for live/sandbox modes)
  let apiKey: string = "";
  if (mode === "sandbox" || mode === "live") {
    try {
      apiKey = getApiKey(mode, env);
    } catch (err) {
      console.error(`\n❌ ${err}`);
      console.log("\nPlease set the appropriate API key in your .env file:");
      if (mode === "sandbox") {
        console.log("LS_TEST_API_KEY=your_test_api_key_here");
      } else {
        console.log("LS_LIVE_API_KEY=your_live_api_key_here");
      }
      process.exit(1);
    }
  } else if (mode === "both") {
    // For "both" mode, we'll validate keys exist but don't set a single apiKey
    try {
      getApiKey("sandbox", env);
      getApiKey("live", env);
    } catch (err) {
      console.error(`\n❌ ${err}`);
      console.log("\nPlease set both API keys in your .env file:");
      console.log("LS_TEST_API_KEY=your_test_api_key_here");
      console.log("LS_LIVE_API_KEY=your_live_api_key_here");
      process.exit(1);
    }
  }

  // Get webhook secret
  const webhookSecret = env.LS_WEBHOOK_SECRET || "test-webhook-secret";
  if (!env.LS_WEBHOOK_SECRET) {
    console.log("\n⚠️  LS_WEBHOOK_SECRET not found in .env, using default test secret");
  }

  // Prepare config
  const config = {
    apiKey,
    webhookSecret,
    cachePath: `/tmp/lemonsqueezy-billing-cli-test-cache.json`,
    logPath: `/tmp/lemonsqueezy-billing-cli-test.log`,
    testEmail: env.LS_TEST_EMAIL,
    testLicenseKey: env.LS_TEST_LICENSE_KEY,
    testSubscriptionId: env.LS_TEST_SUBSCRIPTION_ID,
    webhookUrl: env.LS_TEST_WEBHOOK_URL,
  };

  // Confirmation step (only for sandbox/live modes)
  let confirmed = true;
  if (mode !== "offline") {
    const modeDisplay = mode === "both" ? "both sandbox and live" : mode;
    confirmed = await confirmBeforeLive(modeDisplay as "sandbox" | "live", args.yes);
    if (!confirmed) {
      console.log("\nCancelled.");
      process.exit(0);
    }
  }

  try {
    // Phase 1: Offline Tests
    logPhaseStart("📦 Phase 1: Offline Tests (no API key needed)");
    await runOfflineTests(config);
    logPhaseEnd("📦 Phase 1: Offline Tests");

    // Phase 2: Live API Tests (only for sandbox/live modes)
    if (mode === "sandbox" || mode === "live") {
      logPhaseStart(`🌐 Phase 2: Live API Tests (${mode.toUpperCase()})`);
      await runLiveTests(config);
      logPhaseEnd(`🌐 Phase 2: Live API Tests (${mode.toUpperCase()})`);
    } else if (mode === "both") {
      // Run both sandbox and live tests
      logPhaseStart("🌐 Phase 2: Live API Tests (SANDBOX)");
      const sandboxApiKey = getApiKey("sandbox", env);
      const sandboxConfig = { ...config, apiKey: sandboxApiKey };
      await runLiveTests(sandboxConfig);
      logPhaseEnd("🌐 Phase 2: Live API Tests (SANDBOX)");
      
      logPhaseStart("🌐 Phase 2: Live API Tests (LIVE)");
      const liveApiKey = getApiKey("live", env);
      const liveConfig = { ...config, apiKey: liveApiKey };
      await runLiveTests(liveConfig);
      logPhaseEnd("🌐 Phase 2: Live API Tests (LIVE)");
    } else {
      console.log("\n⏭️  Phase 2: Live API Tests skipped (offline mode)");
    }

    // Phase 3: Webhook Simulation Tests
    logPhaseStart("📨 Phase 3: Webhook Simulation Tests");
    await runWebhookTests(config);
    logPhaseEnd("📨 Phase 3: Webhook Simulation Tests");

    // Phase 4: Optional E2E (not implemented in this version)
    if (args.e2e) {
      console.log("\n⚠️  Phase 4: E2E tests not implemented in this version");
      console.log("   For full E2E testing, you would need to:");
      console.log("   1. Start an Express server with webhook route");
      console.log("   2. Complete a real checkout with test card");
      console.log("   3. Wait for webhook delivery");
      console.log("   4. Verify the webhook was processed correctly");
    }

    console.log("\n" + "=".repeat(50));
    const modeDisplay = mode === "both" ? "both sandbox and live" : mode;
    console.log(`\n✨ All tests completed successfully (${modeDisplay})!\n`);
    
    // Show where files were saved for inspection
    console.log('📁 Test files location:');
    console.log(`   Cache file: ${config.cachePath}`);
    console.log(`   Log file: ${config.logPath}`);
    
  } catch (err) {
    console.error("\n💥 Tests failed:", (err as Error).message);
    cleanupFiles(config.cachePath, config.logPath);
    process.exit(1);
  } finally {
    cleanupFiles(config.cachePath, config.logPath);
  }
}

main().catch((err) => {
  console.error("\n💥 CLI test crashed:", (err as Error).message);
  process.exit(1);
});