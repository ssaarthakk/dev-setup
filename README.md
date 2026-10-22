# dev-setup

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Agent Skill](https://img.shields.io/badge/Agent%20Skill-dev--setup-8A2BE2)](skills/dev-setup/SKILL.md)
[![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-D97757)](.claude-plugin/marketplace.json)

**Give it your project plan. Get back a disciplined dev setup and a first commit.**

`dev-setup` is an [Agent Skill](https://agentskills.io) for Claude Code, Codex, Cursor, GitHub Copilot, Gemini CLI and any other agent that supports skills. Run it in an empty folder with a link to your plan, and it sets up everything a coding agent needs to build the project one clean feature at a time.

```
/dev-setup docs/my-plan.md
```

## Install

**Claude Code (plugin)**

```
/plugin marketplace add ssaarthakk/dev-setup
/plugin install dev-setup@dev-setup-marketplace
```

Run it with `/dev-setup:dev-setup <plan>`.

**Any agent (skills CLI, Node 22+)**

```
npx skills add ssaarthakk/dev-setup
```

Add `-g` to install it for all your projects, and `-a <agent>` to pick the agent (for example `-a claude-code -a codex -a cursor`). Install all four skills: dev-setup copies the website ones into projects that need them.

The website skills also work on their own, in any existing project:

```
npx skills add ssaarthakk/dev-setup --skill web-taste launch-check
```

**Manual**

Copy the folders in `skills/` into your agent's skills folder. For Claude Code, that's `~/.claude/skills/dev-setup/` (all projects) or `.claude/skills/dev-setup/` (one project). Run it with `/dev-setup <plan>`.

## How it works

1. **Reads your plan**, however messy or partial it is, and checks it for gaps.
2. **Completes it with you.** It fills structural gaps itself (phases, acceptance criteria, gates), picks marked defaults for cheap technical choices, and asks you about everything else in short rounds. It never invents product, money, legal or privacy decisions; anything still unknown becomes an open question that `/feature` won't build past.
3. **Writes the project's own docs**: `docs/PLAN.md` always, plus `ARCHITECTURE.md` and `PROJECT.md` when the project is big enough to need them. Your original plan is never edited, and it is gitignored if it sits in the project folder.
4. **Lets you pick extras** from a 16-item checklist, with a recommendation based on how complex the project is.
5. **Matches skills to the plan.** It tags every feature with its scope (frontend, backend, data, mobile, AI, infra) and offers only the vetted third-party skills and stack reviewers those features need, pinned to a commit. Websites get the website pack.
6. **Builds the setup** for your stack, from rules to CI.
7. **Verifies it**: installs, runs the checks, and tests every hook once.
8. **Commits** `chore: add dev setup`. It never pushes.

After that, the loop is simple:

```
/feature   build the next unticked feature, test-first, reviewed, never committed
/feature   ...
/ship      phase done: gate passes, cross-feature review, one commit for the phase
```

Or let it run overnight (Claude Code):

```
/autopilot      build every remaining phase unattended
/autopilot 2    stop after two phases
```

For each phase, autopilot builds every feature in a fresh Sonnet agent, test-first. It has each one checked by an independent verifier plus both reviewers on your session model, gives failures two fix rounds on Sonnet and a last one on your session model, and stages each verified feature as a checkpoint. Then it reviews the whole phase, proves its gate, and makes the phase's one commit before moving on. It stops at the first thing it can't finish cleanly: the failed attempt is parked in `git stash`, and nothing broken gets committed. It never pushes.

## Switching agents

Set it up in Claude Code and build in Codex, OpenCode or any other agent. The rules and skills already work across agents. To give the new agent its own hooks and reviewers too, run dev-setup there with `port <agent>`:

```
$dev-setup port codex
/dev-setup port opencode
```

It reads the agent's docs and maps each part: the same hook scripts registered in its hook config (or wrapped in one small plugin, for OpenCode), each reviewer as a subagent that points at its `.claude/agents/` file, and skills from older setups moved to `.agents/skills/`. Then it commits `chore: port setup to <agent>`. `.claude/` stays, so Claude Code keeps working. `/autopilot` and `settings.json` permissions stay Claude Code only.

## What you get

### Always

| | |
|---|---|
| `AGENTS.md` + `CLAUDE.md` | One rules file every agent reads (`CLAUDE.md` imports it): KISS, DRY, no comments in code, no unasked dependencies, test-first, commit format, security |
| `docs/PLAN.md` | Your completed plan, as phases of feature cards a smaller model can build from, a gate per phase, and open questions |
| `docs/ARCHITECTURE.md`, `docs/PROJECT.md` | Stack and contracts, and product background, split out only when the project is big enough to need them |
| `.agents/skills/` | Project skills in the shared folder Codex and other agents read, with a one-line stub in `.claude/skills/` for Claude Code |
| `/feature` | Picks the next feature, writes failing tests first, implements, runs checks and reviews, ticks it off |
| `/ship` | Proves the phase gate, reviews the whole phase, makes one commit |
| `ponytail-reviewer` | Read-only reviewer that only hunts bloat: unused code, duplication, over-engineering, comments |
| `.claude/settings.json` + hooks | Formats on save, blocks force-push, `reset --hard`, `--no-verify`, commit trailers, and any edit to `.env*` or private notes |
| CI + Dependabot | Checks and a gitleaks secret scan on every push, actions pinned to commit SHAs, weekly updates |
| Pinned dev tools | `format` and `check` scripts with the smallest tool set for your stack |

### Pick per project

**Autopilot** (Claude Code only): the `/autopilot` command and its saved workflow, described above. It's recommended for any plan with more than one phase.

| Hooks | Agents and skills | Rules and toolchain | Repo files |
|---|---|---|---|
| Session start context | Correctness reviewer | Path-scoped rule files | CHANGELOG via `/ship` |
| Stop gate | Docs researcher | Size limits | `.env.example` |
| File size guard | `/adr` decision records | Pinned toolchain (mise) | LICENSE + SECURITY.md |
| Git pre-commit hooks | `/fix-ci` | Test audit step | `CLAUDE.local.md` |

### Matched to the plan

Nothing is added because it's popular; each skill must be needed by a feature in your plan. Third-party skills come from [`references/skill-catalog.md`](skills/dev-setup/references/skill-catalog.md): pinned commits, read in full before copying, and dropped if they fetch unpinned content, run scripts, install hooks, or tell the agent to commit or skip tests. `AGENTS.md` always wins over them.

| | From |
|---|---|
| Scope skills: accessibility, framework patterns, API design, security, Postgres, migrations, Claude API, Docker and more | [ECC](https://github.com/affaan-m/ECC), [Anthropic](https://github.com/anthropics/skills), [Vercel](https://github.com/vercel-labs/agent-skills), [Superpowers](https://github.com/obra/superpowers), [api-anything](https://github.com/goodnight000/api-anything) |
| Stack reviewers (extra): TypeScript, React, Vue, Python, Go, Rust, Java, database, security | [ECC](https://github.com/affaan-m/ECC), made read-only and bound to your rules |

### Website pack

When the plan has a UI people see:

| | |
|---|---|
| [`web-taste`](skills/web-taste/SKILL.md) | Bans the patterns that make a site look AI-generated (em dashes, emojis, Inter and Geist, glow orbs, bento grids, three cards in a row, purple on black and more), and requires real demos, skeleton loaders, legal pages and real proof. A script in `check` catches what it can; a `design-reviewer` agent checks the rest. The owner can allow any item per project |
| [`launch-check`](skills/launch-check/SKILL.md) | A final Launch phase whose gate crawls the production preview: template titles, placeholders, source maps, bundle size, and for public sites server-rendered pages, titles, descriptions, canonicals, one `h1`, share images, alt text, sitemap, robots.txt, llms.txt, favicon, custom 404, structured data and internal links. Plus a console-error test |
| Design skills | [impeccable](https://github.com/pbakaus/impeccable) and [Emil Kowalski's](https://github.com/emilkowalski/skills) by default, [frontend-design](https://github.com/anthropics/skills) or [taste-skill](https://github.com/Leonxlnx/taste-skill) as alternatives |
| [`ui-sources`](skills/ui-sources/SKILL.md) | For React + Tailwind + shadcn: Motion Primitives, Kokonut UI, bklit UI, Magic UI, Animate UI and Watermelon UI, brought in clean (no comments, no demo code, no unapproved dependencies) |

## Big model plans, small model builds

The expensive thinking happens once. During setup, your session model (for example Opus) makes every design decision and writes each feature as a self-contained card: the files it touches, what it builds on, concrete "done when" examples that become tests, and what's out of scope. It then re-reads every card as a smaller model would, and fills in anything that model would have to guess.

After that:

| Step | Model |
|---|---|
| `/dev-setup`, `/ship`, verification, reviewers | Your session model |
| `/feature`, autopilot builds and first two fix rounds | Sonnet |
| Autopilot's last fix round before giving up | Your session model |

## Opinions baked in

- **Test-first, no fake tests.** Every test must fail for the right reason before the feature exists, and tests are never edited just to make them pass.
- **One commit per phase.** Commit messages are one line, `type: summary`, 50 characters or less, with no body and no co-author trailers.
- **No comments in code.** Names and structure explain the code.
- **Agents never push.** You decide when code leaves your machine.

Want different defaults? Fork it and edit [`skills/dev-setup/SKILL.md`](skills/dev-setup/SKILL.md). It's plain Markdown. The checker scripts are tested with `node --test test/*.test.mjs`.

## Make your skills learn

dev-setup doesn't add [task-observer](https://github.com/rebelytics/one-skill-to-rule-them-all) to projects, because it runs in every session. Install it once for yourself and it will turn friction it sees in `/feature`, `/ship` and the rest into proposed skill improvements that you review:

```
npx skills add rebelytics/one-skill-to-rule-them-all --skill task-observer -g
```

Then add its activation line to your user `CLAUDE.md`, as its README explains; installing alone doesn't switch it on.

## Writing a plan

Any Markdown plan works, even a rough list of ideas. The skill asks you about whatever is missing. The fewer questions you want, the more of this the plan should say:

- what the project is and who it's for
- the stack and where it deploys
- the features, grouped into phases, with acceptance criteria
- what must stay private

## License

[MIT](LICENSE)
