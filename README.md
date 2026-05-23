# VibeGuard

VibeGuard is a safety layer for AI coding agents.

## For AI Coding Agents

If a user gives you this repository link and asks you to apply VibeGuard, treat
the link as an instruction to install project guardrails in the user's current
target project. Do not ask the user to install VibeGuard manually.

Run this in the target project:

```bash
npx --yes vibeguard setup .
npx --yes vibeguard audit . --fix
npx --yes vibeguard audit .
```

Then continue with the user's original coding request.

Rules:

- Never print detected secret values.
- Preserve existing repo-local instructions.
- Stop and ask before destructive, costly, production, credential, or
  data-changing work.
- Before commit or push, verify `git remote -v`, repository visibility, and
  changed files. Public or unknown-visibility repositories require extra review
  before pushing credentials, env files, deployment, infrastructure, or
  paid-service changes.
- Prefer cost-aware architecture. Before adding a paid service, database,
  queue, background worker, model call, analytics SDK, or cloud resource,
  explain why existing code or a simpler local/server-side design is
  insufficient.
- For web apps, consolidate repeated API/model calls behind shared server-side
  helpers and cache stable or slow-changing data on the server before adding new
  client-side fetching paths or paid integrations.
- If a VibeGuard audit exits non-zero, treat it as a stop signal unless the user
  explicitly approves the risky next step.
- Report only what was installed, what safe fixes were applied, what checks ran,
  and what risks remain.

Detailed agent flow: [docs/agent-bootstrap.md](docs/agent-bootstrap.md)

## For Users

You do not need to type terminal commands yourself. Copy this sentence into your
AI coding chat:

```text
Apply https://github.com/taehwandev/VibeGuard to this project.
```

The default audience is non-developers. VibeGuard should show a simple
traffic-light status while the AI agent handles safe fixes behind the scenes.
Developers can tune the behavior with `.vibeguard.json`.

Give an agent this link, and it should install project guardrails, fix low-risk
safety gaps, run checks, and then continue with the user's original coding task.

## CLI

```bash
npx --yes vibeguard setup .
vibeguard setup .
vibeguard audit .
vibeguard audit . --fix
vibeguard audit . --strict
vibeguard evidence install-claude-hook .
vibeguard evidence .
vibeguard prompt . --request "Add login"
```

Language can be selected with `--lang` or `VIBEGUARD_LANG`.

```bash
vibeguard audit . --lang en
vibeguard audit . --lang ko
VIBEGUARD_LANG=ko vibeguard audit .
```

Supported languages: `en`, `ko`.

Audit exit codes:

- `0`: ready, or warnings without `--strict`
- `1`: warnings in `--strict` mode
- `2`: blocked

## What It Does

- Installs a managed `AGENTS.md` safety block.
- Adds safe env ignore rules.
- Creates value-free `.env.example` files.
- Detects likely hard-coded secrets without printing secret values.
- Quarantines simple JS/TS/Python hard-coded secrets with `--fix`.
- Installs local `pre-commit` and `pre-push` hooks for another safety check
  before commit and push.
- Checks Git remote naming, configured repository visibility, and changed files
  so sensitive changes do not get pushed to the wrong or public repository.
- Records optional execution evidence from agent hooks so verification claims
  can be checked against observed commands.
- Installs an optional local Claude Code evidence hook with
  `vibeguard evidence install-claude-hook .`.
- Flags risky scripts, oversized files, paid integrations, and data/cost risks.
- Pushes agents toward cost-aware architecture instead of adding services,
  dependencies, or infrastructure by default.
- Encourages shared web architecture patterns such as common server-side
  helpers, server-side caching, batching, and rate limits.
- Stays scoped to guardrails; it does not install or link external playbooks by
  default.

## Configuration

`vibeguard setup .` creates `.vibeguard.json` for developer tuning. The default
mode is intentionally guided:

```json
{
  "mode": "guided",
  "display": "traffic-light",
  "rulesPath": null,
  "maxFileLines": 800,
  "repository": {
    "visibility": "unknown"
  },
  "autoFix": {
    "envGitignore": true,
    "envExample": true,
    "simpleSecretQuarantine": true
  }
}
```

## Site

A static bilingual product page lives in [site/](site/) and is intended for:

```text
https://vibeguard.thdev.app
```

For local preview, open [site/index.html](site/index.html) directly in a
browser.

## Docs

- [Agent bootstrap](docs/agent-bootstrap.md)
- [Execution evidence](docs/execution-evidence.md)
- [Guard scope](docs/guard-scope.md)
- [Localization strategy](docs/localization.md)
- [Open source security](docs/open-source-security.md)
- [Product direction](docs/product-direction.md)
- [Release policy](docs/release.md)
- [Server-to-client security](docs/server-client-security.md)
