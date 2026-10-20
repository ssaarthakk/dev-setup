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

Add `-g` to install it for all your projects, and `-a <agent>` to pick the agent (for example `-a claude-code -a codex -a cursor`).

**Manual**

Copy `skills/dev-setup/` into your agent's skills folder. For Claude Code, that's `~/.claude/skills/dev-setup/` (all projects) or `.claude/skills/dev-setup/` (one project). Run it with `/dev-setup <plan>`.

## How it works

1. **Reads your plan**, however messy or partial it is, and checks it for gaps.
2. **Completes it with you.** It fills structural gaps itself (phases, acceptance criteria, gates), picks marked defaults for cheap technical choices, and asks you about everything else in short rounds. It never invents product, money, legal or privacy decisions; anything still unknown becomes an open question that `/feature` won't build past.
3. **Writes the project's own docs**: `docs/PLAN.md` always, plus `ARCHITECTURE.md` and `PROJECT.md` when the project is big enough to need them. Your original plan is never edited.
4. **Lets you pick extras** from a 16-item checklist, with a recommendation based on how complex the project is.
5. **Builds the setup** for your stack, from rules to CI.
6. **Verifies it**: installs, runs the checks, and tests every hook once.
7. **Commits** `chore: add dev setup`. It never pushes.

After that, the loop is simple:

```
/feature   build the next unticked feature, test-first, reviewed, never committed
/feature   ...
/ship      phase done: gate passes, cross-feature review, one commit for the phase
```

## What you get

### Always

| | |
|---|---|
| `AGENTS.md` + `CLAUDE.md` | One rules file every agent reads (`CLAUDE.md` imports it): KISS, DRY, no comments in code, no unasked dependencies, test-first, commit format, security |
| `docs/PLAN.md` | Your completed plan, as phases with feature checkboxes, acceptance criteria, a gate per phase, and open questions |
| `docs/ARCHITECTURE.md`, `docs/PROJECT.md` | Stack and contracts, and product background, split out only when the project is big enough to need them |
| `/feature` | Picks the next feature, writes failing tests first, implements, runs checks and reviews, ticks it off |
| `/ship` | Proves the phase gate, reviews the whole phase, makes one commit |
| `ponytail-reviewer` | Read-only reviewer that only hunts bloat: unused code, duplication, over-engineering, comments |
| `.claude/settings.json` + hooks | Formats on save, blocks force-push, `reset --hard`, `--no-verify`, commit trailers, and any edit to `.env*` or private notes |
| CI + Dependabot | Checks and a gitleaks secret scan on every push, actions pinned to commit SHAs, weekly updates |
| Pinned dev tools | `format` and `check` scripts with the smallest tool set for your stack |

### Pick per project

| Hooks | Agents and skills | Rules and toolchain | Repo files |
|---|---|---|---|
| Session start context | Correctness reviewer | Path-scoped rule files | CHANGELOG via `/ship` |
| Stop gate | Docs researcher | Size limits | `.env.example` |
| File size guard | `/adr` decision records | Pinned toolchain (mise) | LICENSE + SECURITY.md |
| Git pre-commit hooks | `/fix-ci` | Test audit step | `CLAUDE.local.md` |

## Opinions baked in

- **Test-first, no fake tests.** Every test must fail for the right reason before the feature exists, and tests are never edited just to make them pass.
- **One commit per phase.** Commit messages are one line, `type: summary`, 50 characters or less, with no body and no co-author trailers.
- **No comments in code.** Names and structure explain the code.
- **Agents never push.** You decide when code leaves your machine.

Want different defaults? Fork it and edit [`skills/dev-setup/SKILL.md`](skills/dev-setup/SKILL.md). It's plain Markdown.

## Writing a plan

Any Markdown plan works, even a rough list of ideas. The skill asks you about whatever is missing. The fewer questions you want, the more of this the plan should say:

- what the project is and who it's for
- the stack and where it deploys
- the features, grouped into phases, with acceptance criteria
- what must stay private

## License

[MIT](LICENSE)
