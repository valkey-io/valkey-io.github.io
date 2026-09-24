#!/usr/bin/env node
/**
 * Generates public/search-index.json (records: { url, title, heading, body })
 * for fuse.js by extracting text from rendered HTML. `heading` is the section
 * heading for section records and "" for page-level records. Zola's native index only sees
 * Markdown bodies, which are empty stubs here (topics/commands/clients are
 * injected at render time), so it can't index the docs.
 *
 * Long pages are split into one record per top-level (h2) section rather than a
 * single whole-page record. This keeps deep content searchable instead of being
 * dropped by a whole-page character cap, and lets results deep-link to the
 * matching section via its heading anchor (e.g. /topics/sentinel/#sentinel-api).
 * Content before the first h2, and pages with no h2, become a single page-level
 * record as before. Nested h3/h4 text is folded into its parent h2 section so
 * the record count stays modest.
 *
 *   node build/build-search-index.mjs                     parse public/ (CI + local)
 *   node build/build-search-index.mjs --crawl <base-url>  fetch a live site via sitemap.xml
 *
 * Run after `zola build`. Crawl mode is a local insight tool, not used by CI.
 */

import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from "node:fs";
import { join, relative, sep, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PUBLIC_DIR = join(ROOT, "public");
const OUTPUT_FILE = join(PUBLIC_DIR, "search-index.json");

// Most specific content container first; .body is the shared fallback.
const CONTENT_SELECTORS = ["main", ".main-inner", ".event-single", ".body"];

// Shared chrome stripped before text extraction so it doesn't pollute the index.
const STRIP_SELECTORS = [
  "script",
  "style",
  "noscript",
  "iframe",
  ".header",
  ".footer",
  ".banner",
  ".site-search",
  "nav",
  ".left-aside",
  ".right-aside",
  ".edit_box",
];

// Pages that are indexes/redirects or otherwise not worth surfacing directly.
const EXCLUDE_URL_PATTERNS = [
  /^\/404\/?$/,
  /^\/authors\/?$/, // author index; individual author pages are still indexed
];

// Safety valve for a single section's body. Sections rarely approach this;
// it only guards against a pathologically large h2 block (e.g. a generated API
// reference with no subheadings). Page-level records for pages without any h2
// are also bounded by this.
const MAX_SECTION_CHARS = 12000;

// Crawl-mode politeness.
const CRAWL_CONCURRENCY = 6;
const CRAWL_DELAY_MS = 50;

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}

function extractTitle($, url) {
  const h1 = normalizeWhitespace($("h1").first().text());
  if (h1) return h1;

  let t = normalizeWhitespace($("title").first().text());
  if (t) {
    // Drop the "Valkey ·" / "Valkey Documentation ·" prefix, keep the specific part.
    const parts = t.split("\u00b7");
    if (parts.length > 1) {
      t = parts.slice(1).join("\u00b7").trim();
    }
    if (t) return t;
  }
  return url;
}

// Resolves the primary content container and strips shared chrome from it,
// returning the cheerio node ready for text extraction (or null if empty).
function getContentContainer($) {
  let $container = null;
  for (const selector of CONTENT_SELECTORS) {
    const found = $(selector).first();
    if (found.length) {
      $container = found;
      break;
    }
  }
  if (!$container) {
    const body = $("body").first();
    $container = body.length ? body : $.root();
  }

  for (const selector of STRIP_SELECTORS) {
    $container.find(selector).remove();
  }
  return $container;
}

function capBody(text) {
  return text.length > MAX_SECTION_CHARS ? text.slice(0, MAX_SECTION_CHARS) : text;
}

// Splits a page's content container into search records, one per top-level
// (h2) section, plus a page-level record for the content preceding the first
// h2. h3/h4 headings and their text are folded into the enclosing h2 section
// rather than becoming their own records, to keep the record count modest.
//
// Section records deep-link to the heading anchor when the h2 carries an id
// (Zola emits ids on all headings), so a hit lands on the relevant section.
//
// Pages with no h2 collapse to a single page-level record, matching the
// previous whole-page behavior.
//
// Ranking note: every record for a page carries the SAME `title` (the page
// title), so a query naming the page scores identically whether it matches the
// page-level record or a section record. The section heading goes in a separate
// low-weight `heading` field (for a light relevance boost and for display), and
// its text is also folded into `body`. Keeping the heading out of the
// high-weight `title` field is deliberate: putting it there both diluted page
// title matches (longer field = weaker fuzzy score) and let section-heading
// words win spurious high-weight matches, pushing better page results down.
function recordsFromContainer($, $container, pageUrl, pageTitle) {
  const records = [];

  // A section accumulates the text of its heading and everything up to the
  // next h2. `null` heading means the page-level lead section (before any h2).
  let current = { heading: null, id: null, parts: [] };
  const sections = [current];

  // Walk the container's descendants in document order, treating every h2 as a
  // section boundary regardless of how deeply it is nested. We accumulate text
  // from text nodes only (never an element's aggregate .text()), so a wrapping
  // element does not double-count the text of its children. This covers lead
  // content, content after a nested-heading block, and sibling blocks such as a
  // feature-comparison table that live outside the first h2's parent -- an
  // earlier version iterated only the first h2's parent and silently dropped
  // all of that.
  const root = $container.get(0);
  const startSection = (el) => {
    const $el = $(el);
    current = {
      heading: normalizeWhitespace($el.text()),
      id: $el.attr("id") || null,
      parts: [],
    };
    sections.push(current);
    // Include the heading text itself in the searchable body.
    if (current.heading) current.parts.push(current.heading);
  };

  const visit = (node) => {
    if (!node) return;
    if (node.type === "text") {
      const text = normalizeWhitespace(node.data || "");
      if (text) current.parts.push(text);
      return;
    }
    if (node.type !== "tag") return;
    const tag = (node.tagName || "").toLowerCase();
    if (tag === "h2") {
      // Start a new section; the heading's own text is captured via .text()
      // in startSection, so we do not descend into it again.
      startSection(node);
      return;
    }
    const children = node.children || [];
    for (const child of children) visit(child);
  };

  for (const child of root.children || []) visit(child);

  // A section only becomes its own record if its h2 has an id to deep-link to.
  // Anchorless sections (h2 with no id) can't be linked individually, so their
  // text is folded into the page-level lead record instead of producing several
  // records that share the bare page url.
  const leadParts = [];
  const sectionRecords = [];
  for (const section of sections) {
    const text = normalizeWhitespace(section.parts.join(" "));
    if (!text) continue;

    if (section.heading === null || !section.id) {
      leadParts.push(text);
    } else {
      sectionRecords.push({
        url: `${pageUrl}#${section.id}`,
        title: pageTitle,
        heading: section.heading,
        body: capBody(text),
      });
    }
  }

  const leadBody = capBody(normalizeWhitespace(leadParts.join(" ")));
  if (leadBody) {
    records.push({ url: pageUrl, title: pageTitle, heading: "", body: leadBody });
  }
  records.push(...sectionRecords);

  // Guarantee at least one record for a page that has content but produced
  // none above (e.g. text only inside unexpected wrappers): fall back to the
  // whole-container text as a page-level record.
  if (!records.length) {
    const whole = capBody(normalizeWhitespace($container.text()));
    if (whole)
      records.push({ url: pageUrl, title: pageTitle, heading: "", body: whole });
  }

  return records;
}

// Returns an array of records for a page (possibly empty). Redirect pages
// (Zola aliases / external-url events emit <meta http-equiv="refresh">) have no
// useful content and yield no records.
function recordsFromHtml(html, url) {
  const $ = cheerio.load(html);

  const refresh = $('meta[http-equiv]').filter(
    (i, el) => ($(el).attr("http-equiv") || "").toLowerCase() === "refresh"
  );
  if (refresh.length) return [];

  const title = extractTitle($, url);
  const $container = getContentContainer($);
  const records = recordsFromContainer($, $container, url, title);

  // Drop a lone page-level record that has neither body nor a real title
  // (matches the previous "no body and title === url" skip).
  if (
    records.length === 1 &&
    !records[0].body &&
    records[0].title === url
  ) {
    return [];
  }
  return records;
}

function isExcluded(url) {
  return EXCLUDE_URL_PATTERNS.some((re) => re.test(url));
}

function walkHtmlFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walkHtmlFiles(full));
    } else if (entry.endsWith(".html")) {
      out.push(full);
    }
  }
  return out;
}

// e.g. public/topics/sentinel/index.html -> /topics/sentinel/
function fileToUrl(file) {
  let rel = relative(PUBLIC_DIR, file).split(sep).join("/");
  if (rel === "index.html") {
    rel = "";
  } else if (rel.endsWith("/index.html")) {
    rel = rel.slice(0, -"index.html".length);
  } else if (rel.endsWith(".html")) {
    rel = rel.slice(0, -".html".length) + "/";
  }
  return "/" + rel;
}

function buildFromPublic() {
  let files;
  try {
    files = walkHtmlFiles(PUBLIC_DIR);
  } catch (err) {
    console.error(
      `Could not read ${PUBLIC_DIR}. Run \`zola build\` first.\n${err.message}`
    );
    process.exit(1);
  }

  const seen = new Set();
  const records = [];

  for (const file of files) {
    const url = fileToUrl(file);
    if (isExcluded(url) || seen.has(url)) continue;
    const html = readFileSync(file, "utf8");
    const pageRecords = recordsFromHtml(html, url);
    if (!pageRecords.length) continue;
    seen.add(url);
    records.push(...pageRecords);
  }
  return records;
}

function toRelativeUrl(absUrl, baseUrl) {
  try {
    const u = new URL(absUrl);
    let path = u.pathname;
    if (!path.endsWith("/") && !path.includes(".")) path += "/";
    return path;
  } catch {
    return absUrl.startsWith("/") ? absUrl : "/" + absUrl;
  }
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "user-agent": "valkey-search-indexer/1.0" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function getSitemapUrls(baseUrl) {
  const sitemapUrl = new URL("sitemap.xml", baseUrl).toString();
  const xml = await fetchText(sitemapUrl);
  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
  if (!locs.length) {
    throw new Error(`No <loc> entries found in ${sitemapUrl}`);
  }
  return locs;
}

async function mapWithConcurrency(items, limit, worker) {
  const results = [];
  let index = 0;
  async function run() {
    while (index < items.length) {
      const current = index++;
      results[current] = await worker(items[current], current);
      if (CRAWL_DELAY_MS) await new Promise((r) => setTimeout(r, CRAWL_DELAY_MS));
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

async function buildFromCrawl(baseUrl) {
  console.log(`Crawling ${baseUrl} via sitemap.xml ...`);
  const locs = await getSitemapUrls(baseUrl);
  console.log(`Found ${locs.length} URLs in sitemap.`);

  const seen = new Set();
  const targets = [];
  for (const loc of locs) {
    const url = toRelativeUrl(loc, baseUrl);
    if (isExcluded(url) || seen.has(url)) continue;
    seen.add(url);
    targets.push({ abs: loc, url });
  }

  let failures = 0;
  const settled = await mapWithConcurrency(
    targets,
    CRAWL_CONCURRENCY,
    async ({ abs, url }) => {
      try {
        const html = await fetchText(abs);
        return recordsFromHtml(html, url);
      } catch (err) {
        failures++;
        console.warn(`  skip ${url}: ${err.message}`);
        return [];
      }
    }
  );

  if (failures) console.warn(`Crawl completed with ${failures} failed page(s).`);
  return settled.flat();
}

function parseArgs(argv) {
  const args = { crawl: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--crawl") {
      args.crawl = argv[i + 1];
      i++;
      if (!args.crawl || args.crawl.startsWith("--")) {
        console.error("--crawl requires a base URL, e.g. --crawl https://valkey.io");
        process.exit(1);
      }
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const records = args.crawl
    ? await buildFromCrawl(args.crawl)
    : buildFromPublic();

  records.sort((a, b) => a.url.localeCompare(b.url));

  mkdirSync(PUBLIC_DIR, { recursive: true });
  writeFileSync(OUTPUT_FILE, JSON.stringify(records), "utf8");

  console.log(`Wrote ${records.length} records to ${relative(ROOT, OUTPUT_FILE)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
