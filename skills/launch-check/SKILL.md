---
name: launch-check
description: Make a website ready to launch, covering SEO, social sharing, crawler files, a custom 404, accessibility basics, console errors, bundle size and leftover template defaults. Use before shipping or launching any website or web app, or when asked to audit one for launch readiness.
license: MIT
---

# Launch check

A site is ready to launch when `scripts/check-launch.mjs` passes against a production preview, the console-error test passes, and the review list below holds.

## Run it

1. Build for production and start the production preview server (for example `vite preview`, `next start`, `astro preview`), not the dev server.
2. Run `node <path>/check-launch.mjs <preview url> [--public] [--local-business[=<schema type>]] [--max-js-kb=<n>]`. It crawls the home page, every internal link and the sitemap, and exits 1 on any problem.
   - `--public` for a public website. Leave it off for internal tools, dashboards and local apps.
   - `--local-business` when the site is for a local business. Pass the schema.org type if it's more specific, for example `--local-business=Restaurant`.
   - `--max-js-kb` sets the gzipped size budget per script (default 200).

## What it checks

Every site:

| Id | Rule |
|---|---|
| `default-title` | No template title like "Vite + React", "Create Next App" or an empty title |
| `placeholder` | No lorem ipsum, "your company here", placeholder text or TODO on any page |
| `source-map` | No source maps served in production. Turn them off in the build config |
| `bundle-size` | Every script is within the budget. Split routes, lazy-load heavy parts, drop unused dependencies |

Public sites (`--public`) also:

| Id | Rule |
|---|---|
| `empty-shell` | The page source has real content: render on the server or prerender, so crawlers and link previews see it |
| `duplicate-title`, `meta-description`, `duplicate-description` | Every page has its own title and meta description |
| `canonical` | Every page has an absolute canonical link |
| `one-h1` | Exactly one `h1` per page |
| `og-image` | Every page has a social share image (`og:image`, 1200×630) |
| `alt-text` | Every image has an `alt` attribute |
| `orphan-page` | Every page is linked from another page |
| `site-file`, `sitemap` | `robots.txt`, a `sitemap.xml` that lists the pages, and `llms.txt` |
| `favicon` | A favicon |
| `structured-data` | JSON-LD structured data on the home page |
| `local-business` | The LocalBusiness schema (or the given type), with `--local-business` |
| `not-found` | Unknown URLs return a real 404 status with a custom page that links home |

## Console errors

Add one end-to-end test (Playwright if the project has it) that opens every page from the sitemap, or the main routes for an internal app, and fails on any `console.error` or uncaught page error.

## Review what the script can't

- Alt text describes the image; decorative images use `alt=""`.
- Pages nested more than one level deep have breadcrumbs, with `BreadcrumbList` structured data.
- Internal links help a reader move on: related pages link to each other, not only from the nav.
- Structured data matches the page. LocalBusiness name, address, phone and hours are the owner's real details.
- `robots.txt` points to the sitemap, and the sitemap uses the canonical domain.
- `llms.txt` describes the site and links its key pages.
- The browser tab title and the favicon are the product's own on every page, including the 404.
