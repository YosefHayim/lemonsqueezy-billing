import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { BillingCache } from "../types/index.js";

const DEFAULT_CACHE_PATH = "./billing-cache.json";
const DEFAULT_TTL_MS = 3_600_000;

export function readCache(cachePath?: string): BillingCache | undefined {
  const path = cachePath ?? DEFAULT_CACHE_PATH;
  try {
    const raw = readFileSync(path, "utf-8");
    return JSON.parse(raw) as BillingCache;
  } catch {
    return undefined;
  }
}

export function writeCache(cache: BillingCache, cachePath?: string): void {
  const path = cachePath ?? DEFAULT_CACHE_PATH;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(cache, null, 2) + "\n", "utf-8");
}

export function isCacheValid(cache: BillingCache | undefined, ttlMs?: number): boolean {
  if (!cache) return false;
  const ttl = ttlMs ?? DEFAULT_TTL_MS;
  const generatedAt = new Date(cache.generatedAt).getTime();
  return Date.now() - generatedAt < ttl;
}
