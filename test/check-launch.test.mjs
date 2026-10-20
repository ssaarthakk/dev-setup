import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import { checkSite } from "../skills/launch-check/scripts/check-launch.mjs";

function page({ title, description, body, extra = "" }) {
  return `<!doctype html><html><head><title>${title}</title><meta name="description" content="${description}"><link rel="canonical" href="https://example.org/"><meta property="og:image" content="https://example.org/og.png"><link rel="icon" href="/icon.svg">${extra}</head><body>${body}</body></html>`;
}

const GOOD = {
  "/": page({
    title: "Pine Bakery",
    description: "Sourdough baked daily in Leeds.",
    extra: `<script type="application/ld+json">{"@type":"LocalBusiness","name":"Pine Bakery"}</script><script src="/app.js"></script>`,
    body: `<h1>Pine Bakery</h1><p>Sourdough and pastries baked every morning.</p><a href="/menu">Menu</a><img src="/loaf.jpg" alt="A sourdough loaf">`,
  }),
  "/menu": page({ title: "Menu | Pine Bakery", description: "Breads and pastries with prices.", body: `<h1>Menu</h1><p>Sourdough loaf, croissant, cinnamon bun.</p><a href="/">Home</a>` }),
  "/app.js": "console.log(1)",
  "/robots.txt": "User-agent: *",
  "/sitemap.xml": "<urlset><url><loc>https://example.org/</loc></url><url><loc>https://example.org/menu</loc></url></urlset>",
  "/llms.txt": "# Pine Bakery",
};

const BAD = {
  "/": `<!doctype html><html><head><title>Vite + React</title><script src="/app.js"></script></head><body><div id="root"></div><a href="/about">About</a></body></html>`,
  "/about": `<html><head><title>Vite + React</title></head><body><h1>About</h1><h1>Us</h1><p>Lorem ipsum dolor sit amet, consectetur.</p><img src="/x.png"></body></html>`,
  "/app.js": "console.log(1)\n//# sourceMappingURL=app.js.map",
};

async function serve(files, notFound = "Not Found") {
  const server = createServer((request, response) => {
    const body = files[request.url];
    response.writeHead(body === undefined ? 404 : 200, { "content-type": "text/html" });
    response.end(body ?? notFound);
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() };
}

function ids(problems) {
  return [...new Set(problems.map((problem) => problem.split(" ")[1].slice(0, -1)))].sort();
}

test("a complete public site passes", async () => {
  const site = await serve(GOOD, `<h1>Page not found</h1><a href="/">Go home</a>`);
  assert.deepEqual(await checkSite(site.url, { publicSite: true, localBusiness: "LocalBusiness" }), []);
  site.close();
});

test("a default public site fails every launch check", async () => {
  const site = await serve(BAD);
  assert.deepEqual(ids(await checkSite(site.url, { publicSite: true, localBusiness: "LocalBusiness" })), [
    "alt-text",
    "canonical",
    "default-title",
    "duplicate-title",
    "empty-shell",
    "favicon",
    "local-business",
    "meta-description",
    "not-found",
    "og-image",
    "one-h1",
    "placeholder",
    "site-file",
    "sitemap",
    "source-map",
    "structured-data",
  ]);
  site.close();
});

test("an internal app only gets the universal checks", async () => {
  const site = await serve(BAD);
  assert.deepEqual(ids(await checkSite(site.url)), ["default-title", "placeholder", "source-map"]);
  site.close();
});

test("an oversized bundle breaks the budget", async () => {
  const site = await serve({ ...GOOD, "/app.js": Array.from({ length: 40000 }, (_, i) => `v${i * 7919}`).join(";") });
  assert.deepEqual(ids(await checkSite(site.url, { maxJsKb: 10 })), ["bundle-size"]);
  site.close();
});
