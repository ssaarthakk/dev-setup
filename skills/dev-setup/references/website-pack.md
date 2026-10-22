# Website pack

Use this when the plan has a UI that people see: a website, web app, dashboard or landing page.

The pack's skills are sibling folders of this skill's folder: `web-taste`, `launch-check` and `ui-sources`. If they aren't there (only dev-setup was installed), fetch them from `skills/` in `github.com/ssaarthakk/dev-setup` at the commit this skill came from, or `main` if you can't tell.

Copy each one to `.agents/skills/<name>/` unchanged, with a Claude stub as in section 5 of dev-setup. Exclude `.agents/skills/` and `.claude/skills/` from the formatter, linter and unused-code tools: those files are vendored, not project code.

## Taste: always

1. Copy `web-taste`.
2. Add `node .agents/skills/web-taste/scripts/check-taste.mjs <UI source folders>` to the `check` script, with the UI folders from `docs/ARCHITECTURE.md`.
3. Add an empty `## Design exceptions` section to `docs/PROJECT.md` (or `docs/PLAN.md`) with one line under it: `Banned patterns from web-taste that this project allows, as "- <id>: <why>". Only the owner adds lines here.` If the plan or my answers already ask for something web-taste bans (for example a purple brand), list it there.
4. Build `.claude/agents/design-reviewer.md`, read-only exactly like `ponytail-reviewer`. It reviews the UI files it is given against the Review section of `.agents/skills/web-taste/SKILL.md` and nothing else. If there's nothing to change, it says `No design problems found.`
5. `/feature` runs it alongside the ponytail reviewer when the feature touched UI files, and `/ship` runs it on the whole phase. Add it to autopilot's `REVIEWERS` if autopilot is set up.
6. Turn the must-haves into feature cards where they apply: skeleton loaders on every feature that loads data; a real product demo on the landing page; Terms and Privacy pages for public sites with sign-ups, payments, analytics or cookies; testimonials and stats only if I gave real ones. Legal text and real proof come from me, so put them under `## Open questions` until I supply them.
7. Add to `AGENTS.md`: `UI work follows .agents/skills/web-taste/SKILL.md. It overrides every other design skill.`

## Launch: always, with more for public sites

Copy `launch-check`. Decide from the plan whether the site is public (indexed by search engines, shared on social) or internal (a tool, dashboard or local app), and whether it's for a local business. If it's unclear, ask in step 1b.

For a public site, the stack must render pages to HTML on the server or at build time, so the page source has real content. If the plan's stack can't (for example a plain Vite single-page app), ask me in step 1b, with a stack that can as the recommended answer.

Add a final phase, `## Phase <n>: Launch`, with these cards:
- **Production build:** source maps off, a per-script size budget (200 KB gzipped unless the plan needs more), the product's own title and favicon on every page, no template or placeholder content.
- **Console-error test:** one end-to-end test that opens every page (or the main routes) and fails on any console error or uncaught page error.
- Public sites only:
  - **Page metadata:** a unique title and meta description, an absolute canonical link, one `h1` and an `og:image` share image on every page; descriptive alt text on every image.
  - **Crawler files:** `sitemap.xml`, `robots.txt` pointing to it, `llms.txt`, and the favicon.
  - **Custom 404:** unknown URLs return status 404 with the site's own page linking home.
  - **Structured data and links:** JSON-LD on the home page (`LocalBusiness`, or a more specific type, for a local business, with the owner's real details as an open question until given), breadcrumbs with `BreadcrumbList` on nested pages, internal links between related pages.

Gate: `check-launch.mjs` passes against the production preview (with `--public` and `--local-business` where they apply), and the console-error test passes.

To run it: if the project has Playwright, put both in one end-to-end file that uses Playwright's `webServer` to start the production preview. One test asserts that `checkSite(baseURL, options)`, imported from `.agents/skills/launch-check/scripts/check-launch.mjs`, returns no problems; the other is the console-error test. Without Playwright, add a `check:launch` script that builds, starts the preview, runs the script and stops the preview.

Add to `AGENTS.md`: `Launch readiness follows .agents/skills/launch-check/SKILL.md.`

## Design and components: when the look matters

Offer these for public sites and product UI where the look matters, not for plain internal tools.

In the step 2b round, ask:
- **Design skills** (multi-select, from the catalog's design table): impeccable and `emil-design-eng` recommended, `review-animations` if the plan has meaningful motion, `transitions-dev` and `transitions-polish` if it has interactive UI states, `frontend-design` and `taste-skill` as alternatives. Describe impeccable's binary and hook in its option.
- **UI registries** (multi-select), only for React + Tailwind + shadcn stacks: the registries in the `ui-sources` skill, recommended where the plan's features need them (charts: bklit UI; text and reveal motion: Motion Primitives; marketing sections: Kokonut UI or Magic UI).

For picked registries:
1. Copy `ui-sources`.
2. List the picked registries under an `Approved UI registries` heading in `docs/ARCHITECTURE.md`, and add `shadcn` (pinned) and `motion` to the approved dependencies.
3. Add to `AGENTS.md`: `New UI components come from the approved registries, following .agents/skills/ui-sources/SKILL.md.`

Animation libraries, added to the approved dependencies only when a feature needs them: Motion (motion.dev) by default, anime.js for long timeline sequences, three.js (or React Three Fiber in React) for real 3D.
