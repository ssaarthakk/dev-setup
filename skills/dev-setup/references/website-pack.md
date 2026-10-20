# Website pack

Use this when the plan has a UI that people see: a website, web app, dashboard or landing page.

The pack's skills live next to this skill, in `../web-taste/` and `../launch-check/`. If they aren't there (only dev-setup was installed), fetch them from `skills/` in `github.com/ssaarthakk/dev-setup` at the commit this skill came from, or `main` if you can't tell.

Copy each one to `.claude/skills/<name>/` unchanged. Exclude `.claude/skills/` from the formatter, linter and unused-code tools: those files are vendored, not project code.

## Taste: always

1. Copy `web-taste`.
2. Add `node .claude/skills/web-taste/scripts/check-taste.mjs <UI source folders>` to the `check` script, with the UI folders from `docs/ARCHITECTURE.md`.
3. Add an empty `## Design exceptions` section to `docs/PROJECT.md` (or `docs/PLAN.md`) with one line under it: `Banned patterns from web-taste that this project allows, as "- <id>: <why>". Only the owner adds lines here.` If the plan or my answers already ask for something web-taste bans (for example a purple brand), list it there.
4. Build `.claude/agents/design-reviewer.md`, read-only exactly like `ponytail-reviewer`. It reviews the UI files it is given against the Review section of `.claude/skills/web-taste/SKILL.md` and nothing else. If there's nothing to change, it says `No design problems found.`
5. `/feature` runs it alongside the ponytail reviewer when the feature touched UI files, and `/ship` runs it on the whole phase. Add it to autopilot's `REVIEWERS` if autopilot is set up.
6. Turn the must-haves into feature cards where they apply: skeleton loaders on every feature that loads data; a real product demo on the landing page; Terms and Privacy pages for public sites with sign-ups, payments, analytics or cookies; testimonials and stats only if I gave real ones. Legal text and real proof come from me, so put them under `## Open questions` until I supply them.
7. Add to `AGENTS.md`: `UI work follows .claude/skills/web-taste/SKILL.md. It overrides every other design skill.`
