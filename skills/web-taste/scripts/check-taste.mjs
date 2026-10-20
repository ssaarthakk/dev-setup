import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const SCANNED = new Set([".html", ".htm", ".jsx", ".tsx", ".js", ".ts", ".vue", ".svelte", ".astro", ".md", ".mdx", ".css", ".scss", ".json"]);
const SKIPPED = new Set(["node_modules", "dist", "build", "out", "coverage", ".git", ".next", ".nuxt", ".output", ".svelte-kit", ".astro", ".vercel"]);
const EXCEPTION_FILES = ["docs/PROJECT.md", "docs/PLAN.md"];

export const RULES = [
  { id: "em-dash", pattern: /\u2014/, message: "em dash in UI text; use a comma, colon or full stop" },
  { id: "emoji", pattern: /\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F/u, message: "emoji in the UI" },
  { id: "stock-font", pattern: /\b(?:Inter|Geist|Space[ _]Grotesk)\b|fontsource(?:-variable)?\/(?:inter|geist|space-grotesk)\b|["']geist["']|geist\/font/, message: "Inter, Geist or Space Grotesk font" },
  { id: "not-x-but-y", pattern: /\b(?:it['\u2019]?s|it is|this is|that['\u2019]?s)\s+not\s+[^.!?\n]{1,60}?[,;:\u2013-]\s*(?:it['\u2019]?s|it is|this is|that['\u2019]?s)\b/i, message: "\"it's not X, it's Y\" copy" },
  { id: "sparkle-icon", pattern: /\bSparkles?(?:Icon)?\b/, message: "sparkle icon" },
  { id: "liquid-glass", pattern: /backdrop-filter|backdrop-blur/, message: "liquid glass (backdrop blur)" },
];

export function readExceptions(root) {
  const allowed = new Set();
  for (const file of EXCEPTION_FILES) {
    const path = join(root, file);
    if (!existsSync(path)) continue;
    const section = readFileSync(path, "utf8").split(/^## Design exceptions\s*$/m)[1];
    if (!section) continue;
    for (const line of section.split(/^## /m)[0].split("\n")) {
      const match = line.match(/^\s*-\s*`?([a-z-]+)`?\s*:/);
      if (match) allowed.add(match[1]);
    }
  }
  return allowed;
}

function filesUnder(path) {
  if (!existsSync(path)) return [];
  if (statSync(path).isFile()) return [path];
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    if (SKIPPED.has(entry.name)) return [];
    const child = join(path, entry.name);
    if (entry.isDirectory()) return filesUnder(child);
    return SCANNED.has(extname(entry.name)) ? [child] : [];
  });
}

export function findProblems(paths, allowed) {
  const rules = RULES.filter((rule) => !allowed.has(rule.id));
  return paths.flatMap(filesUnder).flatMap((file) =>
    readFileSync(file, "utf8")
      .split("\n")
      .flatMap((line, index) =>
        rules.filter((rule) => rule.pattern.test(line)).map((rule) => `${file}:${index + 1} ${rule.id}: ${rule.message}`),
      ),
  );
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1] ?? "")).href) {
  const paths = process.argv.slice(2);
  if (paths.length === 0) {
    console.error("Usage: node check-taste.mjs <folder or file>...");
    process.exit(2);
  }
  const problems = findProblems(paths, readExceptions(process.cwd()));
  for (const problem of problems) console.error(problem);
  if (problems.length > 0) {
    console.error(`\n${problems.length} design problem(s). Fix them, or add an approved exception under "## Design exceptions" in docs/PROJECT.md.`);
    process.exit(1);
  }
}
