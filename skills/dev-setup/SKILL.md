---
name: dev-setup
description: Read a project plan, complete it with the user, turn it into project docs, and set up the dev environment for it (rules, skills, reviewers, hooks, CI, chosen extras), then make the first commit. Run in the new, empty project folder.
license: MIT
disable-model-invocation: true
argument-hint: <path or URL to the project plan>
---

# Dev setup from a project plan

Plan: `$ARGUMENTS`

This is setup only. Build no product code beyond the smallest placeholder the checks need to run on.

This skill works in any agent that supports Agent Skills. The project it sets up works for every agent too: the rules go in `AGENTS.md`, which most coding agents read, and `CLAUDE.md` imports it. The `.claude/` folder adds Claude Code's hooks, subagents and settings on top. Git hooks and CI enforce the same rules no matter which agent wrote the code.

Whenever this skill says "ask me", use your structured question tool if you have one (AskUserQuestion in Claude Code). Otherwise, ask in plain text as a numbered list I can answer by number. Put your recommended answer first.

## 0. Before anything

1. If no plan was given, ask for its path or URL and stop.
2. Read the whole plan, and any docs it links to.
3. Run `git status`. If this folder already has commits, stop and tell me. This skill is for new projects only.
4. Check the current official Claude Code docs for the exact formats of skills, subagents, rules, hooks and `settings.json` before writing any of them. Use a docs tool or subagent if you have one; otherwise fetch the docs. Names change between versions.

## 1. Complete the plan and write the project docs

The plan I give you can be messy, partial, or both. Never edit my original. Build the project's own docs from it; after setup, every agent works from those docs, never from the original.

### 1a. Check what's missing

Check the plan against this list:

| Doc | Must know |
|---|---|
| Project | What it is, who it's for, the problem it solves, what's out of scope, what must stay private |
| Architecture | Language and framework, package manager, where it deploys, data storage, external services and APIs, auth (if it has users), the main parts and how they talk to each other |
| Plan | Every feature, its acceptance criteria, grouped into phases, with a gate per phase |

For each gap, choose one of three:
- **Fill it yourself** when it is structure, not a decision: group features into phases (foundations first, then the smallest slice that's useful), draft missing acceptance criteria from the feature's description, write each phase's gate.
- **Pick a default** when the choice is technical, common, and cheap to change later (for example a formatter, a test runner, a folder layout). Mark it `(default)` in the docs.
- **Ask me** about everything else: anything about the product, users, money, legal, privacy, or a technical choice that's expensive to undo (stack, hosting, database, auth). Never invent these.

### 1b. Ask

Ask in rounds of at most four questions, most important first, each with your recommended answer. Use my answers to decide whether the next round is needed. After three rounds, stop asking: put whatever is still unknown under `## Open questions` in `docs/PLAN.md`.

Then show me, in one message, the acceptance criteria and phases you drafted and the defaults you picked. Ask me to confirm or correct them in one reply.

### 1c. Write the docs

Split by size, so each session reads only what it needs:

- **`docs/PLAN.md`, always.** Only the build plan: `## Phase <n>: <name>` headings, a `- [ ]` checkbox per feature with its acceptance criteria, a one-line **Gate:** per phase, and `## Open questions` if any are left. Write each Gate as something an agent can prove by running commands (tests, a script, a build, a request to a local server), so `/autopilot` can check it unattended. If a gate truly needs a person, say so on its line.
- **`docs/ARCHITECTURE.md`** when the project has more than one part, a data store, or external services: stack, folder layout, how the parts talk, data shapes and contracts, external services.
- **`docs/PROJECT.md`** when the background is more than a short paragraph: what it is, who it's for, the problem, out of scope, what stays private.

When a doc isn't needed, put its content as a short section at the top of `docs/PLAN.md` instead.

If my original plan is inside the project folder, leave it where it is and add its path to `.gitignore`. The docs above replace it in the repo.

## 2. Pick the extras

The core setup (sections 3 to 10) is always built. The 16 extras in section 11 are optional. Ask me about them in one go, as four multi-select questions, with the extra names as options and their one-line purpose as descriptions:

1. **Hooks:** Session start context, Stop gate, File size guard, Git pre-commit hooks
2. **Agents and skills:** Correctness reviewer, Docs researcher, /adr skill, /fix-ci skill
3. **Rules and toolchain:** Path-scoped rule files, Size limits, Pinned toolchain, Test audit step
4. **Repo files:** CHANGELOG via /ship, .env.example, LICENSE + SECURITY.md, CLAUDE.local.md

Before asking, say in two or three lines which extras you recommend for this project and why. For example: a small static site doesn't need the correctness reviewer, Docs researcher or Pinned toolchain; a multi-language app with external APIs should get nearly all of them. Build only the extras I pick, and leave out every line in the core sections that only applies to an extra I didn't pick.

## 3. Repo basics

- `git init -b main` if needed.
- Folders: the source folder(s) the stack needs, `docs/`, `.claude/`, `.github/`.
- `.gitignore`: the stack's build and dependency folders, `.env*` except `.env.example`, OS files, `*playbook*.md`, `CLAUDE.local.md`.
- `.editorconfig` with sensible defaults.
- Short `README.md`: what the repo is, how to install, how to run the checks, how to deploy.
- Dev tools for the stack, with exact pinned versions. Pick the smallest set that covers formatting, linting, type checking (if typed), tests, unused code, and anything the project specifically needs (for example a link checker for a static site).
- Scripts: `format` (format everything) and `check` (the full gate: format check, lint, types, unused code, tests). Add `check:fast` (lint and types only) if the Stop gate or Git pre-commit hooks extra is picked. Add other scripts only if the project needs them.

## 4. `AGENTS.md` and `CLAUDE.md`

`AGENTS.md` holds every rule, for all agents. `CLAUDE.md` contains only the line `@AGENTS.md`, plus Claude-specific notes if there are any. Don't use a symlink; symlinks break on Windows.

Keep `AGENTS.md` short; it loads every session. Start with one line on what the project is, then one line per doc from step 1c saying what it holds and when to read it. Then add a commands section (install, `format`, `check`, dev server if any) and these rules:

**Code style**
- KISS: the simplest thing that fully works. No abstractions "for later".
- DRY: don't repeat logic or content that changes together. Don't add tooling just to remove small, stable repetition; ask first.
- Simple, readable, complete. A beginner should understand every file.
- No comments anywhere in the codebase: none in code, markup, styles, shell, YAML or config. Clear names and structure explain the code instead. The only exception is a shebang line.
- No dead code, no unused exports, files or dependencies.
- No new dependencies, frameworks or third-party scripts without asking first.
- Add the stack-specific rules the project implies. For example: semantic HTML and accessibility for sites; validating external data at boundaries and never swallowing errors for apps; no analytics or trackers without asking.

**Testing**
- Test first, always: write the tests for a feature before any of its code, and run them to confirm each fails for the right reason (the behaviour is missing, not a typo or import error).
- Tests check behaviour from the acceptance criteria, not implementation details. A test that would still pass if the feature broke is a fake test; delete it.
- Never edit a test just to make it pass. If a test is wrong, say why, then fix the test before the code.

**Workflow**
- Work follows `docs/PLAN.md`. Build one feature at a time with `/feature`.
- When every feature in a phase is ticked, run `/ship`. It makes exactly one commit for the whole phase. Never commit or push outside `/ship` (or the ship step of `/autopilot`, if this project has it).
- The steps for `/feature` and `/ship` are in `.claude/skills/feature/SKILL.md` and `.claude/skills/ship/SKILL.md`. If your agent has no slash commands, read that file and follow it when asked to build a feature or ship a phase. Do the same for the reviewers in `.claude/agents/`: when a step says to run a reviewer, apply its file as a review checklist.
- Run `check` before saying anything is done.
- When a requirement is unclear, ask. Don't guess. Never build on an item in `## Open questions`; ask me to answer it first.

**Git**
- Commit message: one line, `type: summary`, max 50 characters, lowercase, no period. Types: feat, fix, chore, docs, refactor, test, ci.
- No commit body. No Co-Authored-By or any other trailer.
- Never push, force-push, `reset --hard`, or use `--no-verify`.

**Security**
- Never write secrets, API keys or personal data into the repo.
- Never read or edit `.env*` files or `*playbook*` files.
- Add the project's own security needs (for example `rel="noopener noreferrer"` on external links, security headers for the host).

## 5. Project skills in `.claude/skills/`

Both are user-invoked only: set the frontmatter so no agent triggers them on its own.

### `/feature`: build the next feature, never commit

1. Pick the first unchecked feature in the current phase of `docs/PLAN.md`, or the one named in the arguments. If every feature in the current phase is ticked, tell me to run `/ship` and stop.
2. Run `git status`. Uncommitted changes are expected (earlier features of this phase). If anything uncommitted doesn't belong to this phase, stop and tell me.
3. If the feature depends on anything under `## Open questions`, ask me, record the answer in the right doc, remove it from the list, and carry on.
4. Tell me in one or two lines which feature you're starting and what you'll change.
5. Read only what the feature touches: the relevant part of `docs/ARCHITECTURE.md` (if it exists) and the nearest existing code. If it uses a third-party library, check its current docs first (Docs researcher extra).
6. Write the tests first and nothing else, straight from the acceptance criteria. Run them and confirm each fails for the right reason.
7. Write the least code that makes them pass, following `AGENTS.md`. Never edit a test to make it pass.
8. Run `check` and fix every failure.
9. Run the `ponytail-reviewer` on the files this feature touched. Remove every bloat item it reports, unless removing it would break the feature. In that case keep it and say why in one line.
10. Test audit (extra): delete any test that wouldn't fail if its behaviour broke, duplicates another test, or tests trivial code.
11. Run the `correctness-reviewer` (extra) on the same files and fix every must-fix item.
12. Run `check` again.
13. If the feature changed the structure, contracts or services, update `docs/ARCHITECTURE.md`. Tick the feature in `docs/PLAN.md`.
14. Give a short summary: what changed, which files, which tests, what the reviewers changed. If that was the last feature of the phase, tell me to run `/ship`. Otherwise tell me to start a fresh session and run `/feature`. Do not commit.

### `/ship`: commit the finished phase

Stop and report at the first step that fails.
1. Every feature in the current phase must be ticked. If not, list the unticked ones and stop.
2. Run `check`. Fix every failure.
3. Show the phase's Gate passing, then ask me to confirm. Stop if I don't.
4. Run the `ponytail-reviewer` (and the `correctness-reviewer`, if present) on all uncommitted changes together, looking for what only shows across features: repeated code, drifted contracts, code a later feature made unused. Fix what they report, then run `check` again.
5. Make sure `docs/ARCHITECTURE.md` (if it exists) matches the code.
6. Add the phase's user-visible changes under `[Unreleased]` in `CHANGELOG.md` (extra).
7. Mark the phase heading in `docs/PLAN.md` with `(shipped)`.
8. Run `git status` and `git diff --stat`. Stage the phase's files. Never stage `.env*`, playbook files, `CLAUDE.local.md` or anything gitignored.
9. Commit with one line: `feat: <phase name>`, max 50 characters. No body, no trailers.
10. Show the commit hash and message. Do not push.

## 6. Reviewer: `.claude/agents/ponytail-reviewer.md`

A small, strict reviewer whose only job is finding bloat. Read-only tools: Read, Grep, Glob, and `git diff` / `git status`. It never edits files.

It reviews the files or diff it is given and reports, as a short list with file and line:
- Unused code, styles, classes, files, assets or dependencies
- Duplication that should be shared
- Over-engineering: abstractions, options or wrappers the feature doesn't need
- Code that the platform or standard library already provides
- Any code comment at all
- Anything outside the current feature's scope

If there's nothing to remove, it says `No bloat found.` and nothing else. No style preferences, no new feature ideas.

## 7. `.claude/settings.json` and hooks

- Turn off co-author attribution for commits and PRs (currently `"attribution": { "commit": "", "pr": "" }`; confirm in the docs).
- Permissions: allow the `check`, `check:fast` and `format` scripts, `git status`, `git diff`, `git log`. Deny reading or editing `.env*` (except `.env.example`), and deny `git push`.
- Hooks are small, readable scripts in `.claude/hooks/`. Use Node `.mjs` if the project has Node; otherwise use `sh`. They must work on Windows too, so shell hooks match both `Bash` and `PowerShell` tools.
  - After any Edit or Write: format the changed file.
  - Before any shell command: block `git push --force`, `git push -f`, `git reset --hard`, `--no-verify`, `core.hooksPath` and `Co-Authored-By`, with a clear message.
  - Before any Edit or Write: block paths matching `.env*` (except `.env.example`) or `*playbook*`.
- Plugins and MCP servers: list the ones the stack would benefit from (for example a payments plugin if the project takes payments). Ask me which to add in one multi-select question, and add only the ones I pick.
- In the same round of questions, ask whether to add **Autopilot** (section 12): unattended, phase-by-phase building with a commit per phase, for example overnight. It needs Claude Code's Workflow tool. Recommend it for projects with more than one phase.

## 8. GitHub

`.github/workflows/ci.yml`:
- Runs on push and pull request, with `permissions: contents: read`.
- Job 1: checkout, set up the toolchain (from `mise.toml` if Pinned toolchain is picked), install from the lockfile, run `check`.
- Job 2: scan for committed secrets with gitleaks.
- Pin every third-party action to a full commit SHA. No version comments next to them; Dependabot keeps them updated.

`.github/dependabot.yml`: weekly updates for the project's package ecosystem(s) and GitHub Actions.

## 9. Verify

1. Install dependencies, then run `check`. Everything must pass.
2. Test each hook once by piping sample input into it, and confirm it blocks, formats or reports as expected.
3. Run `git status`. Make sure no `.env*`, playbook, `CLAUDE.local.md` or gitignored file would be staged.

## 10. Commit and report

1. Stage everything and commit with exactly `chore: add dev setup`. No body, no trailers. Do not push.
2. Report: the docs written and what went in each, the defaults you picked, the open questions left, the extras built, the file tree with one line on what each file does, and the commit hash. Then tell me to run `/feature` to start Phase 1, or `/autopilot` if it was added.

## 11. Extras

Build only the ones picked in step 2.

**Hooks**
- **Session start context:** a SessionStart hook (startup, resume, compact) that prints the current phase, the next unticked feature in `docs/PLAN.md`, the number of open questions, and `git status --short`.
- **Stop gate:** a Stop hook that runs `check:fast` and blocks stopping with the failures if it fails. It exits early when the input says a stop hook is already active, so it can't loop.
- **File size guard:** a PostToolUse hook on Edit and Write that reports any source file over 300 lines back to the agent and asks it to split by responsibility. Skip lockfiles, docs and generated files.
- **Git pre-commit hooks:** a lefthook config that runs gitleaks on staged files and `check:fast` before every commit, whichever agent or person commits.

**Agents and skills**
- **Correctness reviewer:** `.claude/agents/correctness-reviewer.md`, read-only like ponytail-reviewer. It checks, in order: correctness (logic errors, cases that can really happen), contracts against `docs/ARCHITECTURE.md` and boundary validation, security (secrets, unvalidated input, shell strings), and tests (every acceptance criterion has a test that would fail without the feature; no fake or redundant tests). It reports **Must fix** and **Consider** items with file, line and the concrete fix, or says there is nothing in one line.
- **Docs researcher:** `.claude/agents/docs-researcher.md`, read-only with web access. Given a library and a question, it returns the current API answer with a source link. Prefer Context7 if I add it as an MCP server in step 7.
- **/adr skill:** writes `docs/adr/NNNN-<slug>.md` with Context, Decision and Consequences, a few lines each. Agents may invoke it on their own when a real decision is made. Add one line to `AGENTS.md`: record real decisions with `/adr`.
- **/fix-ci skill:** user-invoked. Uses `gh run list` and `gh run view --log-failed` to read the latest failed CI run, reproduces it locally, fixes it, and runs `check`. It never commits or pushes.

**Rules and toolchain**
- **Path-scoped rule files:** move language and area rules out of `AGENTS.md` into `.claude/rules/<topic>.md` (for example `typescript.md`, `python.md`, `testing.md`), each scoped with `paths` frontmatter so Claude Code loads it only when matching files are touched. `AGENTS.md` keeps the rules that apply everywhere, plus one line per rule file saying which files it covers, so other agents read it before touching them.
- **Size limits:** add to `AGENTS.md`: files ≤ 300 lines, functions ≤ 50 lines, ≤ 4 parameters; split by responsibility, not by type.
- **Pinned toolchain:** a `mise.toml` pinning the runtime, package manager, gitleaks and lefthook versions. README install steps start with `mise install`.
- **Test audit step:** keep step 10 of `/feature`.

**Repo files**
- **CHANGELOG via /ship:** a `CHANGELOG.md` in Keep a Changelog format with an empty `[Unreleased]` section, and keep step 6 of `/ship`.
- **.env.example:** every environment variable the project needs, with empty values.
- **LICENSE + SECURITY.md:** MIT unless the plan says otherwise; ask if the repo is private. `SECURITY.md` says how to report a vulnerability privately.
- **CLAUDE.local.md:** a gitignored file for my machine-specific notes (OS, shell, local paths). Start it with the OS and shell detected. Other agents can be pointed at it from their own local config.

## 12. Autopilot (Claude Code only, if picked in step 7)

Autopilot builds the plan unattended, phase by phase. For each phase it builds every unticked feature in a fresh agent (test-first, following `/feature`), verifies each one with an independent verifier plus both reviewers, gives failures up to two fix rounds, and stages each verified feature as a checkpoint. When the phase is done, it reviews the whole phase, proves the Gate, and commits once with `feat: <phase name>`. Then it moves on to the next phase. It never pushes. It stops at the first feature or phase it can't finish cleanly: the failed attempt goes to `git stash`, earlier work stays staged, and nothing broken is committed.

1. Build the Correctness reviewer extra too, even if I didn't pick it; autopilot relies on it.
2. Copy this skill's own `assets/autopilot.js` to `.claude/workflows/autopilot.js` without changes. Check the current docs for where saved workflows live and move it if needed.
3. Create the user-invoked skill `.claude/skills/autopilot/SKILL.md`, with an optional number of phases as its argument:
   1. Run `git status` and read `docs/PLAN.md`. Tell me which phase it will start from, how many features are left, and how many phases it will run (all remaining ones if no number was given).
   2. Remind me that it runs unattended: start Claude Code in a permission mode that won't stop for approvals (auto mode), and keep the machine awake. It commits each phase locally and never pushes.
   3. Run the saved workflow `autopilot` with the Workflow tool, passing `{ "phases": <number> }` as args when a number was given.
   4. When it returns, report each phase's commit and features, why it stopped, and anything in `git stash list` from this run. Tell me the next step: review the commits and push, or resolve the reported problem and run `/autopilot` again.
4. Add one line to `AGENTS.md`: `/autopilot` builds and commits whole phases unattended; never run it unless I ask.
