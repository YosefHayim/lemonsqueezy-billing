import { createHmac } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";

export interface TestConfig {
  apiKey: string;
  webhookSecret: string;
  cachePath: string;
  logPath: string;
  testEmail?: string;
  testLicenseKey?: string;
  testSubscriptionId?: string;
  webhookUrl?: string;
}

export function loadEnv(): Record<string, string> {
  const envPath = ".env";
  const env: Record<string, string> = {};
  
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf-8");
    const lines = content.split("\n");
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        env[key] = valueParts.join("=");
      }
    }
  }
  
  // Override with process.env
  Object.assign(env, process.env);
  
  return env;
}

export function getApiKey(mode: "sandbox" | "live" | "both", env: Record<string, string>): string {
  if (mode === "sandbox") {
    const key = env.LS_TEST_API_KEY;
    if (!key) {
      throw new Error("LS_TEST_API_KEY not found in .env or environment variables");
    }
    // For JWT tokens, we can check if it's a valid JWT format
    // JWT tokens have three parts separated by dots
    if (!key.includes(".")) {
      throw new Error("LS_TEST_API_KEY appears to be invalid (not a valid JWT token)");
    }
    return key;
  } else if (mode === "live") {
    const key = env.LS_LIVE_API_KEY;
    if (!key) {
      throw new Error("LS_LIVE_API_KEY not found in .env or environment variables");
    }
    // For JWT tokens, we can check if it's a valid JWT format
    // JWT tokens have three parts separated by dots
    if (!key.includes(".")) {
      throw new Error("LS_LIVE_API_KEY appears to be invalid (not a valid JWT token)");
    }
    return key;
  } else {
    throw new Error("Mode 'both' cannot be used with getApiKey. Use specific mode instead.");
  }
}

export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return email;
  const [local, domain] = email.split("@");
  const maskedLocal = local.length > 2 
    ? local[0] + "*".repeat(local.length - 2) + local[local.length - 1]
    : local[0] + "*";
  return `${maskedLocal}@${domain}`;
}

export function maskKey(key: string): string {
  if (!key || key.length <= 8) return "***";
  return key.slice(0, 4) + "..." + key.slice(-4);
}

export function maskId(id: string): string {
  if (!id || id.length <= 8) return "***";
  return id.slice(0, 4) + "..." + id.slice(-4);
}

export function pass(label: string) { 
  console.log(`  ✅ ${label}`); 
}

export function fail(label: string, error: string) { 
  console.log(`  ❌ ${label}: ${error}`); 
}

export function createHmacSignature(payload: any, secret: string): string {
  return createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");
}

export async function confirmBeforeLive(mode: "sandbox" | "live", skipConfirm: boolean): Promise<boolean> {
  if (skipConfirm) {
    return true;
  }
  
  console.log(`\n⚠️  You are about to run tests against ${mode.toUpperCase()} mode.`);
  console.log("This will make real API calls and may create checkout sessions.");
  console.log("Type 'yes' to confirm, or anything else to cancel.");
  
  const readline = await import("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question("> ", (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "yes");
    });
  });
}

export function cleanupFiles(...paths: string[]) {
  for (const path of paths) {
    try {
      if (existsSync(path)) {
        const fs = require("node:fs");
        fs.unlinkSync(path);
      }
    } catch (err) {
      // Ignore cleanup errors
    }
  }
}

export function logPhaseStart(phase: string) {
  console.log(`\n${phase}\n`);
}

export function logPhaseEnd(phase: string) {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`\n✨ ${phase} complete\n`);
}