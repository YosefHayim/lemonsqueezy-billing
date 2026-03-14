import { writeFileSync } from "node:fs";
import type { ChangelogEntry } from "./extract.js";

const CHANGELOG_URL = "https://docs.lemonsqueezy.com/api/getting-started/changelog";

export function writeLlmTask(
  entry: ChangelogEntry,
  previousDate: string | null,
  docFiles: string[],
): void {
  const bulletLines = entry.items.map(({ text, urls }) => {
    const suffix = urls.length > 0 ? `  →  ${urls.join(", ")}` : "";
    return `- ${text}${suffix}`;
  });

  const docSection =
    docFiles.length > 0
      ? [
          "## Generated API Context",
          "",
          "The pipeline scraped the linked documentation pages. These are the source of truth — review before implementing:",
          "",
          ...docFiles.map((f) => `- [\`${f}\`](./${f})`),
          "",
        ]
      : [];

  const lines = [
    "# 🍋 Lemon Squeezy API Update Task",
    "",
    "## Upstream Changes Detected",
    "",
    `**Changelog date**: ${entry.date}`,
    previousDate ? `**Previous entry**: ${previousDate}` : "**Previous entry**: (first change)",
    `**Detected**: ${new Date().toISOString().slice(0, 10)}`,
    "",
    "### Changelog Bullets (verbatim)",
    "",
    ...bulletLines,
    "",
    ...docSection,
    "## AI Implementation Instructions",
    "",
    "You are an expert TypeScript developer maintaining this Lemon Squeezy SDK wrapper. Execute steps strictly in order:",
    "",
    "1. **Read the Context** — Open every file listed under *Generated API Context*. Those Markdown files contain the scraped attribute tables and JSON payloads — the absolute source of truth for this update.",
    "2. **Compare and Diff** — Locate the corresponding TypeScript interfaces in `src/types/`. Compare our existing types against the newly provided schemas.",
    "3. **Implement Updates**:",
    "   - Add new properties with strict typing (no `any`).",
    "   - Update modified payload structures or webhook event types.",
    "   - Add new API endpoint wrapper methods if introduced, using correct HTTP verbs.",
    "4. **Webhook events** — Update `src/types/webhook/types.ts` and `src/core/webhook.ts`. Add a fixture in `scripts/cli-test/fixtures/` and extend `scripts/cli-test/webhooks.ts`.",
    "5. **Unknown payload shape** — If the changelog omits JSON structure, add:",
    "   ```ts",
    `   // TODO: verify payload shape at ${CHANGELOG_URL}`,
    "   ```",
    "6. **Safety** — Do NOT remove existing properties unless the changelog explicitly states deprecation or removal.",
    "",
    "## Constraints",
    "",
    "- Follow `.cursorrules` strictly.",
    "- Only modify code directly implied by the changelog bullets above.",
    "- Do NOT refactor unrelated code.",
    "- Run `pnpm typecheck && pnpm build` before committing.",
    "",
    "## Links",
    "",
    `- Changelog: ${CHANGELOG_URL}`,
    "- Webhooks reference: https://docs.lemonsqueezy.com/api/webhooks",
  ];

  writeFileSync("LLM_TASK.md", lines.join("\n") + "\n", "utf-8");
}
