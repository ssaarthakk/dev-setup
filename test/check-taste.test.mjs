import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { findProblems, readExceptions } from "../skills/web-taste/scripts/check-taste.mjs";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "../skills/web-taste/scripts/check-taste.mjs");
const EM_DASH = String.fromCodePoint(0x2014);
const ROCKET = String.fromCodePoint(0x1f680);
const CURLY = String.fromCodePoint(0x2019);

function project(files) {
  const root = mkdtempSync(join(tmpdir(), "taste-"));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

function ruleIds(root) {
  return findProblems([join(root, "src")], readExceptions(root)).map((problem) => problem.split(" ")[1].slice(0, -1));
}

test("flags each banned pattern", () => {
  const root = project({
    "src/Hero.tsx": [
      `<p>Fast ${EM_DASH} and simple</p>`,
      `<h1>Ship it ${ROCKET}</h1>`,
      `<p>It${CURLY}s not a tool, it${CURLY}s a teammate.</p>`,
      `import { Sparkles } from "lucide-react";`,
    ].join("\n"),
    "src/app.css": ["body { font-family: Inter, sans-serif; }", ".card { backdrop-filter: blur(8px); }"].join("\n"),
  });
  assert.deepEqual(ruleIds(root).sort(), ["em-dash", "emoji", "liquid-glass", "not-x-but-y", "sparkle-icon", "stock-font"]);
  rmSync(root, { recursive: true });
});

test("passes clean UI and lookalikes", () => {
  const root = project({
    "src/Footer.tsx": `<footer>© 2026 Acme. Interface ✓ done. It is not ready yet.</footer>`,
    "src/node_modules/x/index.js": `export const a = "${EM_DASH}";`,
  });
  assert.deepEqual(ruleIds(root), []);
  rmSync(root, { recursive: true });
});

test("skips rules listed under Design exceptions", () => {
  const root = project({
    "src/a.css": "body { font-family: Inter; }",
    "docs/PROJECT.md": "# Project\n\n## Design exceptions\n\n- stock-font: the brand font is Inter\n\n## Other\n\n- emoji: not an exception\n",
  });
  assert.deepEqual(ruleIds(root), []);
  assert.deepEqual([...readExceptions(root)], ["stock-font"]);
  rmSync(root, { recursive: true });
});

test("exits 1 with problems and 0 without", () => {
  const dirty = project({ "src/a.html": `<p>a ${EM_DASH} b</p>` });
  const clean = project({ "src/a.html": "<p>a, b</p>" });
  const run = (root) => spawnSync(process.execPath, [SCRIPT, "src"], { cwd: root, encoding: "utf8" });
  const failed = run(dirty);
  assert.equal(failed.status, 1);
  assert.match(failed.stderr, /a\.html:1 em-dash/);
  assert.equal(run(clean).status, 0);
  rmSync(dirty, { recursive: true });
  rmSync(clean, { recursive: true });
});
