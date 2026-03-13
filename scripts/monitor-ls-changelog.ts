#!/usr/bin/env tsx
/**
 * Lemon Squeezy changelog monitor.
 * Exit 0: completed (changed or not)
 * Exit 1: scraper error (network failure, selector failure, parse error)
 */

import { createHash } from "node:crypto";
import { extractAllEntries } from "./ls-changelog/extract.js";
import { fetchAndWriteDocPages } from "./ls-changelog/doc-scraper.js";
import { readState, writeStateFile, emitOutput } from "./ls-changelog/state.js";
import { writeLlmTask } from "./ls-changelog/llm-task.js";

const CHANGELOG_URL = "https://docs.lemonsqueezy.com/api/getting-started/changelog";
const FORCE = process.argv.includes("--force");

function shortHash(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

async function main(): Promise<void> {
  let html: string;
  try {
    const res = await fetch(CHANGELOG_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
  } catch (err) {
    console.error(`[monitor-ls-changelog] Network error: ${(err as Error).message}`);
    emitOutput("changed", "false");
    return process.exit(1);
  }

  let entries;
  try {
    entries = extractAllEntries(html);
  } catch (err) {
    console.error(`[monitor-ls-changelog] Parse error: ${(err as Error).message}`);
    emitOutput("changed", "false");
    return process.exit(1);
  }

  if (entries.length === 0) {
    console.error("[monitor-ls-changelog] Selector failure: no entries extracted. Update selectors.");
    emitOutput("changed", "false");
    return process.exit(1);
  }

  const latest = entries[0];
  const bulletHash = shortHash(latest.items.map((i) => i.text).join("\n"));
  const state = readState();

  if (!state) {
    console.log(`[monitor-ls-changelog] Bootstrap: "${latest.date}" (${entries.length} entries)`);
    writeStateFile(latest.date, bulletHash, entries);
    emitOutput("changed", "false");
    return process.exit(0);
  }

  const unchanged = state.date === latest.date && state.hash === bulletHash;

  if (unchanged && !FORCE) {
    console.log(`[monitor-ls-changelog] No change (${latest.date})`);
    emitOutput("changed", "false");
    return process.exit(0);
  }

  if (FORCE && unchanged) {
    console.log(`[monitor-ls-changelog] --force: regenerating docs for "${latest.date}"`);
  } else {
    console.log(`[monitor-ls-changelog] Change detected: "${state.date}" → "${latest.date}"`);
  }

  const allUrls = FORCE
    ? entries.flatMap((e) => e.items.flatMap((i) => i.urls))
    : latest.items.flatMap((i) => i.urls);
  const docFiles = allUrls.length > 0 ? await fetchAndWriteDocPages(allUrls) : [];

  writeLlmTask(latest, state.date, docFiles);
  writeStateFile(latest.date, bulletHash, entries);
  emitOutput("changed", FORCE ? "false" : "true");
  return process.exit(0);
}

main().catch((err: unknown) => {
  console.error("[monitor-ls-changelog] Unexpected error:", (err as Error).message);
  emitOutput("changed", "false");
  process.exit(1);
});
