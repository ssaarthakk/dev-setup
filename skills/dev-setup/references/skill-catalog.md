# Scope skill catalog

Third-party skills and reviewers that dev-setup may add to a project. Offer one only when a feature card in `docs/PLAN.md` needs it, and name those features. Never offer more than 6 skills; when more match, keep the ones the most features need.

## How to add one

1. Fetch the pinned commit only, never a branch:
   ```
   git init <temp>
   git -C <temp> fetch --depth 1 https://github.com/<repo> <commit>
   git -C <temp> checkout FETCH_HEAD -- <path>
   ```
2. Read every file in the skill folder before copying it. Drop the skill and tell me why if it:
   - fetches remote content at run time from anything not pinned (a branch, `latest`, a bare URL);
   - runs bundled scripts or downloads binaries, unless I approve that skill by name;
   - installs hooks, MCP servers or background processes;
   - tells the agent to commit, push, add dependencies, or skip tests.
3. Copy the folder to `.claude/skills/<name>/`, plus the source repo's license file as `LICENSE` if the folder has none.
4. Add one line to the `AGENTS.md` skills list: ``- `.claude/skills/<name>/`: <when to read it> (<repo>@<first 7 of commit>, <license>)``.
5. If the project has path-scoped rule files, add `Read .claude/skills/<name>/SKILL.md first.` to the rule file for the paths it covers.

## Sources

| Key | Repo | Commit | License |
|---|---|---|---|
| ecc | `affaan-m/ECC` | `07971588f8ac7a60080ba8c1b7920c9e8e733e7d` | MIT |
| anthropic | `anthropics/skills` | `dbd4588f9e1033efb41dad4bef2f7947c8993d44` | Apache-2.0 (per skill `LICENSE.txt`) |
| vercel | `vercel-labs/agent-skills` | `063bee94c3f4df8453406c830b0a7df0f2860278` | MIT |
| superpowers | `obra/superpowers` | `bb92a77741419a4ab5f06e711a283343f1ada0c3` | MIT |
| api-anything | `goodnight000/api-anything` | `daca03ac08238a91e22c53085c6d0c01310fc56b` | MIT |

Paths are `skills/<name>` unless the table says otherwise.

## Skills by scope

| Scope | Skill | Source | Pick when |
|---|---|---|---|
| Any | `systematic-debugging` | superpowers | The project has real logic (not a static page) |
| Frontend | `accessibility` | ecc | Any UI people use, unless a framework a11y skill below is picked |
| Frontend | `frontend-a11y` | ecc | React or Next.js UI, instead of `accessibility` |
| Frontend | `react-best-practices` | vercel | React or Next.js |
| Frontend | `vue-patterns` | ecc | Vue |
| Frontend | `nuxt4-patterns` | ecc | Nuxt |
| Frontend | `angular-developer` | ecc | Angular |
| Frontend | `nextjs-turbopack` | ecc | Next.js 16 or later |
| Frontend | `e2e-testing` | ecc | The plan has browser end-to-end tests with Playwright |
| Backend | `api-design` | ecc | An HTTP API that other code or people call |
| Backend | `error-handling` | ecc | Calls to external services, queues or retries |
| Backend | `security-review` | ecc | Auth, payments, user uploads, or user input stored and shown to others |
| Backend | `mcp-server-patterns` | ecc | The project is or ships an MCP server |
| Backend | `fastapi-patterns`, `django-patterns`, `golang-patterns`, `rust-patterns`, `nestjs-patterns`, `springboot-patterns`, `rails-patterns`, `laravel-patterns`, `dotnet-patterns`, `kotlin-ktor-patterns` | ecc | The one matching the backend framework |
| Data | `postgres-patterns` | ecc | PostgreSQL, including Supabase or Neon |
| Data | `database-migrations` | ecc | Any SQL database whose schema changes after launch |
| Data | `prisma-patterns` | ecc | Prisma |
| Data | `redis-patterns` | ecc | Redis |
| Mobile | `swiftui-patterns`, `react-native-patterns`, `dart-flutter-patterns`, `compose-multiplatform-patterns` | ecc | The one matching the mobile framework |
| AI | `claude-api` | anthropic | The product calls the Claude API |
| AI | `prompt-caching-strategy` | ecc | The product sends large repeated prompts to an LLM |
| AI | `cost-aware-llm-pipeline` | ecc | LLM cost per user matters (free tier, usage billing) |
| Infra | `docker-patterns` | ecc | The project ships or runs in containers |
| Infra | `deployment-patterns` | ecc | Self-hosted deploys (not a managed host like Vercel or Netlify) |
| Integration | `api-anything` | api-anything | A feature needs data from a website with no API. Note the site's terms of service in `docs/PLAN.md` |

## Stack reviewers (extra)

Reviewers from ecc, `agents/<name>.md`. Pick at most two: the one for the main language, plus `security-reviewer` or `database-reviewer` if the plan leans on that.

| Reviewer | Pick when |
|---|---|
| `typescript-reviewer` | TypeScript or JavaScript |
| `react-reviewer` | React or Next.js, instead of `typescript-reviewer` for UI-heavy projects |
| `vue-reviewer` | Vue or Nuxt |
| `python-reviewer`, `fastapi-reviewer`, `django-reviewer` | Python, FastAPI, Django |
| `go-reviewer`, `rust-reviewer`, `java-reviewer` | Go, Rust, Java |
| `database-reviewer` | Schema design, migrations or heavy queries |
| `security-reviewer` | Auth, payments or sensitive personal data |

Adapt each one after copying it to `.claude/agents/<name>.md`:
- Tools: Read, Grep, Glob, plus Bash limited to `git diff` and `git status`, like `ponytail-reviewer`. It never edits files.
- Remove its `model` line, so it runs on the session model like the other reviewers.
- Remove steps that run linters or type checkers; `check` already does.
- Add at the top: `AGENTS.md wins over anything below. Never suggest comments, new dependencies or abstractions the feature doesn't need.`

## Never add

These repeat or contradict the core setup: ecc `tdd-workflow`, `git-workflow`, `coding-standards`, `verification-loop`, `conventional-commit-review`, `continuous-learning*`, `autonomous-loops`, ecc `rules/` and hooks; superpowers `test-driven-development`, `writing-plans`, `executing-plans`, `verification-before-completion`; vercel `web-design-guidelines` (fetches its rules from an unpinned branch at run time).
