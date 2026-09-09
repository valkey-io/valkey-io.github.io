#!/usr/bin/env node
/**
 * Generates public/search-index.json (records: { url, title, body }) for
 * fuse.js by extracting text from rendered HTML. Zola's native index only sees
 * Markdown bodies, which are empty stubs here (topics/commands/clients are
 * injected at render time), so it can't index the docs.
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

const MAX_BODY_CHARS = 8000;

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

function extractBody($) {
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

  const text = normalizeWhitespace($container.text());
  return text.length > MAX_BODY_CHARS ? text.slice(0, MAX_BODY_CHARS) : text;
}

// Returns a record, or null for redirect pages (Zola aliases / external-url
// events emit <meta http-equiv="refresh">), which have no useful content.
function recordFromHtml(html, url) {
  const $ = cheerio.load(html);

  const refresh = $('meta[http-equiv]').filter(
    (i, el) => ($(el).attr("http-equiv") || "").toLowerCase() === "refresh"
  );
  if (refresh.length) return null;

  const title = extractTitle($, url);
  const body = extractBody($);
  if (!body && title === url) return null;
  return { url, title, body };
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
    const record = recordFromHtml(html, url);
    if (!record) continue;
    seen.add(url);
    records.push(record);
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
        return recordFromHtml(html, url);
      } catch (err) {
        failures++;
        console.warn(`  skip ${url}: ${err.message}`);
        return null;
      }
    }
  );

  if (failures) console.warn(`Crawl completed with ${failures} failed page(s).`);
  return settled.filter(Boolean);
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
