import { readFileSync, writeFileSync, existsSync, appendFileSync } from "node:fs";
import type { ChangelogEntry } from "./extract.js";
import { CHANGELOG_STATE_FILE } from "../paths.js";

const STATE_FILE = CHANGELOG_STATE_FILE;

export function readState(): { date: string; hash: string } | null {
  if (!existsSync(STATE_FILE)) return null;
  const line = readFileSync(STATE_FILE, "utf-8").split("\n")[0].trim();
  const pipeIdx = line.indexOf("|");
  if (pipeIdx === -1) return null;
  const date = line.slice(0, pipeIdx);
  const hash = line.slice(pipeIdx + 1);
  return date && hash ? { date, hash } : null;
}

function buildTable(entries: ChangelogEntry[]): string {
  const rows = entries.flatMap(({ date, items }) =>
    items.map(({ text, urls }) => {
      const linkCell =
        urls.length > 0 ? urls.map((u, i) => `[${i + 1}](${u})`).join(" ") : "";
      return `| ${date} | ${text} | ${linkCell} |`;
    }),
  );
  return ["| Date | Change | Links |", "|------|--------|-------|", ...rows].join("\n");
}

export function writeStateFile(date: string, hash: string, entries: ChangelogEntry[]): void {
  writeFileSync(STATE_FILE, `${date}|${hash}\n\n${buildTable(entries)}\n`, "utf-8");
}

export function emitOutput(key: string, value: string): void {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    appendFileSync(outputFile, `${key}=${value}\n`, "utf-8");
  } else {
    process.stdout.write(`[output] ${key}=${value}\n`);
  }
}
