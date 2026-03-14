import { load, type CheerioAPI } from "cheerio";

const LS_BASE = "https://docs.lemonsqueezy.com";

export interface BulletItem {
  text: string;
  urls: string[];
}

export interface ChangelogEntry {
  date: string;
  items: BulletItem[];
}

const DATE_RE_LINE =
  /^(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d+\w*,\s+\d{4}$/i;

const DATE_RE_GLOBAL =
  /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d+\w*,\s+\d{4}/gi;

function resolveUrl(href: string): string {
  if (!href || href.startsWith("#")) return "";
  if (href.startsWith("http")) return href;
  return `${LS_BASE}${href.startsWith("/") ? "" : "/"}${href}`;
}

function bulletItem($: CheerioAPI, el: ReturnType<CheerioAPI>): BulletItem {
  const text = el.text().trim().replace(/\s*\n\s*/g, " ");
  const urls = el
    .find("a[href]")
    .map((_, a) => resolveUrl($(a).attr("href") ?? ""))
    .get()
    .filter(Boolean);
  return { text, urls };
}

export function extractAllEntries(html: string): ChangelogEntry[] {
  const $ = load(html);

  // Strategy 1: actual Mintlify structure — li.group wraps each date entry
  const groupItems = $("li.group");
  if (groupItems.length > 0) {
    const entries: ChangelogEntry[] = [];
    groupItems.each((_, el) => {
      const $el = $(el);
      const date = $el.find("h2").first().text().trim();
      const items: BulletItem[] = [];
      $el.find("ul > li, > p").each((_, b) => {
        const item = bulletItem($, $(b));
        if (item.text) items.push(item);
      });
      if (date && items.length > 0) entries.push({ date, items });
    });
    if (entries.length > 0) return entries;
  }

  // Strategy 2: h2 date headings with following sibling ul/p
  const entries: ChangelogEntry[] = [];
  $("h2").each((_, el) => {
    const $el = $(el);
    const dateText = $el.text().trim();
    if (!DATE_RE_LINE.test(dateText)) return;
    const items: BulletItem[] = [];
    let node = $el.next();
    while (node.length > 0 && !node.is("h2")) {
      if (node.is("ul")) {
        node.find("li").each((_, li) => {
          const item = bulletItem($, $(li));
          if (item.text) items.push(item);
        });
      } else if (node.is("p")) {
        const item = bulletItem($, node);
        if (item.text) items.push(item);
      }
      node = node.next();
    }
    if (items.length > 0) entries.push({ date: dateText, items });
  });
  if (entries.length > 0) return entries;

  // Strategy 3: body text regex scan — no link extraction possible
  const body = $("body").text();
  const matches = [...body.matchAll(DATE_RE_GLOBAL)];
  if (matches.length > 0) {
    const first = matches[0];
    const start = first.index ?? 0;
    const end = matches.length > 1 ? (matches[1].index ?? body.length) : body.length;
    const items = body
      .slice(start + first[0].length, end)
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 10)
      .map((text) => ({ text, urls: [] as string[] }));
    if (items.length > 0) return [{ date: first[0], items }];
  }

  return [];
}
