import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

const DEFAULT_TITLE = /^\s*(?:|Vite App|Vite \+ [\w ]+|React App|Create Next App|Svelte(?:Kit)? app|Astro|Document|Untitled)\s*$/i;
const PLACEHOLDER = /lorem ipsum|your (?:company|name|logo|tagline) here|placeholder text|\bTODO\b/i;
const PAGE_PATH = /^\/[^.]*(?:\.html?)?$/;
const MAX_PAGES = 200;

async function get(url) {
  try {
    const response = await fetch(url, { redirect: "follow" });
    return { status: response.status, body: Buffer.from(await response.arrayBuffer()) };
  } catch {
    return { status: 0, body: Buffer.alloc(0) };
  }
}

function all(html, pattern) {
  return [...html.matchAll(pattern)].map((match) => match[1]);
}

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, "i"))?.[1];
}

function tags(html, name) {
  return html.match(new RegExp(`<${name}\\b[^>]*>`, "gi")) ?? [];
}

function meta(html, key, value) {
  return tags(html, "meta").find((tag) => attribute(tag, key)?.toLowerCase() === value);
}

function samePath(href, page, origin) {
  const url = new URL(href, new URL(page, origin));
  return url.origin === origin && PAGE_PATH.test(url.pathname) ? url.pathname : undefined;
}

async function crawl(origin) {
  const sitemap = await get(`${origin}/sitemap.xml`);
  const listed = sitemap.status === 200 ? all(sitemap.body.toString(), /<loc>\s*([^<\s]+)\s*<\/loc>/g).map((loc) => new URL(loc).pathname) : [];
  const queue = ["/", ...listed];
  const pages = new Map();
  const linked = new Set();
  while (queue.length > 0 && pages.size < MAX_PAGES) {
    const path = queue.shift();
    if (pages.has(path)) continue;
    const response = await get(origin + path);
    if (response.status !== 200) continue;
    const html = response.body.toString();
    pages.set(path, html);
    for (const href of all(html, /<a\b[^>]*\bhref=["']([^"'#]+)/gi)) {
      const target = samePath(href, path, origin);
      if (target === undefined) continue;
      if (target !== path) linked.add(target);
      queue.push(target);
    }
  }
  return { pages, listed, linked };
}

function visibleText(html) {
  return html
    .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function checkSite(base, { publicSite = false, localBusiness, maxJsKb = 200 } = {}) {
  const origin = new URL(base).origin;
  const problems = [];
  const report = (where, id, message) => problems.push(`${where} ${id}: ${message}`);
  const { pages, listed, linked } = await crawl(origin);
  if (pages.size === 0) return [`${origin}/ unreachable: the home page did not return 200`];

  const scripts = new Set();
  const seen = { title: new Map(), description: new Map() };
  for (const [path, html] of pages) {
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1].trim() ?? "";
    if (DEFAULT_TITLE.test(title)) report(path, "default-title", `title is "${title}"`);
    if (PLACEHOLDER.test(visibleText(html))) report(path, "placeholder", "placeholder text on the page");
    for (const src of all(html, /<script\b[^>]*\bsrc=["']([^"']+)["']/gi)) scripts.add(new URL(src, origin + path).href);
    if (!publicSite) continue;

    const description = attribute(meta(html, "name", "description") ?? "", "content") ?? "";
    if (description === "") report(path, "meta-description", "missing meta description");
    for (const [key, value] of [["title", title], ["description", description]]) {
      if (value === "") continue;
      if (seen[key].has(value)) report(path, `duplicate-${key}`, `same ${key} as ${seen[key].get(value)}`);
      else seen[key].set(value, path);
    }
    if (!tags(html, "link").some((tag) => attribute(tag, "rel") === "canonical" && /^https?:\/\//.test(attribute(tag, "href") ?? ""))) report(path, "canonical", "missing absolute canonical link");
    const headings = tags(html, "h1").length;
    if (headings !== 1) report(path, "one-h1", `${headings} h1 headings, expected 1`);
    if (!meta(html, "property", "og:image")) report(path, "og-image", "missing og:image social share image");
    for (const image of tags(html, "img").filter((tag) => attribute(tag, "alt") === undefined)) report(path, "alt-text", `image without alt: ${image.slice(0, 80)}`);
    if (visibleText(html).length < 30) report(path, "empty-shell", "page source has no real content; render it on the server or prerender it");
    if (path !== "/" && !linked.has(path)) report(path, "orphan-page", "no internal link points to this page");
  }

  for (const src of scripts) {
    const file = await get(src);
    const kb = Math.round(gzipSync(file.body).length / 1024);
    if (kb > maxJsKb) report(src, "bundle-size", `${kb} KB gzipped, budget ${maxJsKb} KB`);
    if (/\/\/[#@] sourceMappingURL=/.test(file.body.toString()) || (await get(`${src}.map`)).status === 200) report(src, "source-map", "source map is served in production");
  }

  if (!publicSite) return problems;
  for (const file of ["/robots.txt", "/sitemap.xml", "/llms.txt"]) {
    if ((await get(origin + file)).status !== 200) report(file, "site-file", "missing");
  }
  if (listed.length === 0) report("/sitemap.xml", "sitemap", "lists no pages");
  const home = pages.get("/");
  const hasIcon = tags(home, "link").some((tag) => /\bicon\b/.test(attribute(tag, "rel") ?? ""));
  if (!hasIcon && (await get(`${origin}/favicon.ico`)).status !== 200) report("/", "favicon", "missing favicon");
  if (!/application\/ld\+json/i.test(home)) report("/", "structured-data", "home page has no JSON-LD structured data");
  if (localBusiness && !new RegExp(`"@type"\\s*:\\s*"${localBusiness}"`).test(home)) report("/", "local-business", `home page has no ${localBusiness} schema`);
  const missing = await get(`${origin}/launch-check-missing-page`);
  if (missing.status !== 404) report("/launch-check-missing-page", "not-found", `returned ${missing.status}, expected 404`);
  else if (!/href=["']\/["']/.test(missing.body.toString())) report("/launch-check-missing-page", "not-found", "404 page has no link back home; add a custom 404 page");
  return problems;
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1] ?? "")).href) {
  const [base] = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
  const option = (name) => {
    const arg = process.argv.find((candidate) => candidate === `--${name}` || candidate.startsWith(`--${name}=`));
    return arg?.split("=")[1] ?? (arg ? "" : undefined);
  };
  if (!base) {
    console.error("Usage: node check-launch.mjs <preview url> [--public] [--local-business[=<schema type>]] [--max-js-kb=<n>]");
    process.exit(2);
  }
  const problems = await checkSite(base, {
    publicSite: process.argv.includes("--public"),
    localBusiness: option("local-business") === "" ? "LocalBusiness" : option("local-business"),
    maxJsKb: Number(option("max-js-kb") ?? 200),
  });
  for (const problem of problems) console.error(problem);
  if (problems.length > 0) {
    console.error(`\n${problems.length} launch problem(s).`);
    process.exit(1);
  }
}
