import { mkdirSync, writeFileSync } from "node:fs";
import { load } from "cheerio";
import { CHANGELOG_DOCS_DIR } from "../paths.js";

const LS_BASE = "https://docs.lemonsqueezy.com";
const DOCS_DIR = CHANGELOG_DOCS_DIR;

interface Attribute {
  name: string;
  description: string;
}

interface DocPage {
  url: string;
  title: string;
  attributes: Attribute[];
  jsonExample: string;
}

function urlToSlug(url: string): string {
  return url
    .replace(LS_BASE, "")
    .replace(/^\//, "")
    .replace(/[/#]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};

async function fetchPageHtml(url: string): Promise<string | null> {
  try {
    const baseUrl = url.split("#")[0];
    const res = await fetch(baseUrl, { headers: FETCH_HEADERS });
    return res.ok ? res.text() : null;
  } catch {
    return null;
  }
}

function scrapePage(url: string, html: string): DocPage {
  const $ = load(html);
  const fragment = url.split("#")[1];

  let title = $("h1").first().text().trim();
  if (fragment) {
    const fragmentHeading = $(`[id="${fragment}"]`);
    if (fragmentHeading.length > 0) {
      const fragmentTitle = fragmentHeading.clone().find("a").remove().end().text().trim();
      if (fragmentTitle) title = fragmentTitle;
    }
  }

  const attributes: Attribute[] = [];
  $("h3[id]").each((_, el) => {
    const name = $(el).attr("id") ?? "";
    const description = $(el).next("p").text().trim().replace(/\s*\n\s*/g, " ");
    if (name && description) attributes.push({ name, description });
  });

  const jsonLines: string[] = [];
  $("pre[data-language='json'] span[data-line]").each((_, el) => {
    jsonLines.push($(el).text());
  });
  if (jsonLines.length === 0) {
    $("pre[data-language='json']").first().each((_, el) => {
      jsonLines.push($(el).text().trim());
    });
  }

  return { url, title, attributes, jsonExample: jsonLines.join("\n") };
}

function toMarkdown(page: DocPage): string {
  const lines: string[] = [
    `# ${page.title}`,
    "",
    `**Source**: ${page.url}`,
    "",
  ];

  if (page.attributes.length > 0) {
    lines.push("## Attributes", "", "| Property | Description |", "|----------|-------------|");
    for (const { name, description } of page.attributes) {
      lines.push(`| \`${name}\` | ${description} |`);
    }
    lines.push("");
  }

  if (page.jsonExample) {
    lines.push("## JSON Example", "", "```json", page.jsonExample, "```", "");
  }

  return lines.join("\n");
}

export async function fetchAndWriteDocPages(urls: string[]): Promise<string[]> {
  const written: string[] = [];
  const seenBase = new Set<string>();

  for (const url of urls) {
    const baseUrl = url.split("#")[0];
    if (seenBase.has(baseUrl)) continue;
    seenBase.add(baseUrl);

    const html = await fetchPageHtml(url);
    if (!html) {
      console.warn(`[doc-scraper] Could not fetch ${url}`);
      continue;
    }

    const page = scrapePage(url, html);
    if (!page.title && page.attributes.length === 0) {
      console.warn(`[doc-scraper] No content extracted from ${url}`);
      continue;
    }

    const slug = urlToSlug(baseUrl);
    const filePath = `${DOCS_DIR}/${slug}.md`;
    mkdirSync(DOCS_DIR, { recursive: true });
    writeFileSync(filePath, toMarkdown(page), "utf-8");
    written.push(filePath);
    console.log(`[doc-scraper] Wrote ${filePath}`);
  }

  return written;
}
