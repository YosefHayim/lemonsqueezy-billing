import { execSync } from "child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import chalk from "chalk";
import { loading } from "@wizard/components/loading.js";
import { runRealCycleFlow } from "@wizard/utils/real-cycle.js";

// Function to open URLs in the default browser
export async function openUrl(url: string): Promise<void> {
  const { execSync } = await import("child_process");
  const os = await import("os");
  
  const platform = os.platform();
  let command: string;
  
  switch (platform) {
    case 'darwin': // macOS
      command = `open "${url}"`;
      break;
    case 'win32': // Windows
      command = `start "" "${url}"`;
      break;
    case 'linux': // Linux
      command = `xdg-open "${url}"`;
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
  
  try {
    execSync(command, { stdio: 'ignore' });
  } catch (error) {
    console.log(`[x] Failed to open URL: ${error instanceof Error ? error.message : error}`);
  }
}

export async function runValidationTests(): Promise<void> {
  console.log("\n" + chalk.dim("Running validation tests..."));
  
  try {
    // Test TypeScript compilation
    loading.start("Testing TypeScript compilation");
    execSync('pnpm typecheck', { stdio: 'pipe' });
    loading.stop("[+] TypeScript compilation passed");
    
    // Test build process
    loading.start("Testing build process");
    execSync('pnpm build', { stdio: 'pipe' });
    loading.stop("[+] Build process passed");
    
    // Test example file syntax
    loading.start("Testing example file syntax");
    execSync('node --check example.ts', { stdio: 'pipe' });
    loading.stop("[+] Example file syntax valid");
    
    // Test billing configuration
    loading.start("Testing billing configuration");
    // Check if billing-config.ts exists and has proper exports
    const configPath = resolve(process.cwd(), 'billing-config.ts');
    
    if (!existsSync(configPath)) {
      loading.stop("[x] billing-config.ts file not found");
      throw new Error("billing-config.ts file not found");
    }
    
    const fs = await import('node:fs');
    const configContent = fs.readFileSync(configPath, 'utf8');
    if (!configContent.includes('export const billingConfig')) {
      loading.stop("[x] billing-config.ts does not export billingConfig");
      throw new Error("billing-config.ts does not export billingConfig");
    }
    
    loading.stop("[+] Billing configuration valid");
    
    console.log("\n[+] All validation tests passed! ✅");
    console.log("Your billing integration is ready to use.");
    
    // Check if sandbox API key and offer real cycle flow
    await offerRealCycleFlow();
    
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

async function offerRealCycleFlow(): Promise<void> {
  console.log("\n" + chalk.dim("Checking API key type..."));
  
  // Check if this is a sandbox/test API key
  const isSandboxKey = process.env.LEMON_SQUEEZY_API_KEY?.includes('test_') || 
                      process.env.LEMON_SQUEEZY_API_KEY?.includes('sandbox_') ||
                      process.env.LS_TEST_API_KEY === process.env.LEMON_SQUEEZY_API_KEY;
  
  if (!isSandboxKey) {
    console.log("[-] Live API key detected. Skipping real cycle flow test.");
    return;
  }
  
  console.log("[+] Sandbox API key detected!");
  
  console.log("\n" + chalk.dim("Would you like to run a real cycle flow test? (use SPACE to select, ENTER to submit):"));
  const prompts = await import("prompts");
  const response = await prompts.default({
    type: "multiselect",
    name: "runTest",
    message: "Run real cycle flow test:",
    choices: [
      { title: "Yes, run test cycle", value: "yes" },
      { title: "No, skip test", value: "no" }
    ],
    instructions: false,
    hint: "Space to select, Enter to submit",
    onState: (state: any) => {
      if (state.aborted) throw new Error('Aborted');
    }
  });

  if (!response.runTest.includes("yes")) {
    console.log("[-] Skipping real cycle flow test");
    return;
  }

  await runRealCycleFlow();
}