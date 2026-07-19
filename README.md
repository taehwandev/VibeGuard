# VibeGuard

VibeGuard is a preflight safety check for AI coding agents.

- Website: https://vibeguard.thdev.app/
- Tao Agent OS: https://tao.thdev.app/
- Korean guide: [docs/ko.md](docs/ko.md)
- Package: `@taehwandev/vibeguard`

## For AI Coding Agents

If a user gives you this repository link and asks you to apply VibeGuard, treat
the link as an instruction to install project guardrails in the user's current
target project. Do not ask the user to install VibeGuard manually.

Run this in the target project:

```bash
npx --yes @taehwandev/vibeguard@latest setup .
npx --yes @taehwandev/vibeguard@latest audit . --fix
npx --yes @taehwandev/vibeguard@latest audit .
```

Then continue with the user's original coding request.

Rules:

- Never print detected secret values.
- Treat secrets pasted into AI chat as exposed. Do not reuse them in commands,
  logs, GitHub secrets, deployment settings, servers, or files; rotate them and
  enter fresh values only through local provider UI or secret-store prompts.
- Preserve existing repo-local instructions.
- Stop and ask before destructive, costly, production, credential, or
  data-changing work. For every real external production deployment, and any
  deployment whose target is unknown, immediately before execution state the
  exact target and action and wait for fresh user confirmation. Never infer,
  reuse, or bypass approval from earlier wording such as "deploy it" or
  "handle it yourself".
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
- If the audit says VibeGuard guardrails are stale, run
  `npx --yes @taehwandev/vibeguard@latest update .` once and rerun the audit.
- Report only what was installed, what safe fixes were applied, what checks ran,
  and what risks remain.

Detailed agent flow: [docs/agent-bootstrap.md](docs/agent-bootstrap.md)

## For Users

You do not need to type terminal commands yourself. Copy this sentence into your
AI coding chat:

```text
Apply https://github.com/taehwandev/VibeGuard to this project.
```

The default audience is non-developers. VibeGuard should show simple status with
distinct emoji while the AI agent handles safe fixes behind the scenes.
Developers can tune the behavior with `.vibeguard.json`.

Give an agent this link, and it should install project guardrails, fix low-risk
safety gaps, run checks, and then continue with the user's original coding task.

For a Korean walkthrough, read [docs/ko.md](docs/ko.md). The public website is
available at https://vibeguard.thdev.app/.

## CLI

```bash
npx --yes @taehwandev/vibeguard@latest setup .
vibeguard setup .
vibeguard update .
vibeguard version
vibeguard audit .
vibeguard audit . --fix
vibeguard audit . --strict
vibeguard hook run . --event post-edit
vibeguard hook status .
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

`vibeguard version` prints the local package version without hitting the network.

## Agent Hook Fast Path

`vibeguard hook run` is the low-noise path for agent runtime hooks. It reuses
the same deterministic audit core, scans only Git changed files by default, and
writes a compact local status file:

```text
.vibeguard/status.json
```

The default output is one line so agents do not need to read the full audit
report on every edit:

```bash
vibeguard hook run . --event post-edit
vibeguard hook status .
```

Use `--json` when a hook runner needs machine-readable compact status. Use
`--full` for a full scan. For a manual audit limited to the current Git diff,
use `vibeguard audit . --changed-only`; for a narrower spot check, add
`--path <path>`. Git `pre-commit`, `pre-push`, CI, release checks, and manual
review should continue to use `vibeguard audit .` or `vibeguard audit . --strict`.

## What It Does

- Installs a managed `AGENTS.md` safety block.
- Uses a weekly update check by default. Audits warn when local guardrails are
  stale, and the agent refreshes them once with
  `npx --yes @taehwandev/vibeguard@latest update .`.
- Adds safe env ignore rules.
- Keeps runtime env files ignored and env templates such as `.env.example` and
  `.env.sample` value-free.
- Detects likely hard-coded secrets without printing secret values.
- Quarantines simple JS/TS/Python hard-coded secrets with `--fix`.
- Installs local `pre-commit` and `pre-push` hooks for another safety check
  before commit and push.
- Preserves existing Git hooks. VibeGuard installs a named
  `vibeguard-preflight` managed block inside Git's fixed hook files and keeps
  existing hook logic after the safety gate.
- Provides a low-noise `hook run/status` path for agent runtime hooks that need
  compact status without pulling a full audit report into the main agent context.
- Checks Git remote naming, configured repository visibility, and changed files
  so sensitive changes do not get pushed to the wrong or public repository.
- Records optional execution evidence from agent hooks so verification claims
  can be checked against observed commands.
- Installs an optional local Claude Code evidence hook with
  `vibeguard evidence install-claude-hook .`.
- Flags risky scripts, paid integrations, and data/cost risks.
- Pushes agents toward cost-aware architecture instead of adding services,
  dependencies, or infrastructure by default.
- Encourages shared web architecture patterns such as common server-side
  helpers, server-side caching, batching, and rate limits.
- Stays scoped to guardrails; it does not install or link external playbooks by
  default.

## Tao Agent OS Relationship

VibeGuard is the safety gate. Tao Agent OS is the external execution playbook
for planning, implementation, verification, review, and handoff. This repository
links to an existing local Tao Agent OS path when configured, but it does not
clone, vendor, or copy Tao Agent OS into a target project by default.

Tao Agent OS website: https://tao.thdev.app/

## Configuration

`vibeguard setup .` creates `.vibeguard.json` for developer tuning. The default
mode is intentionally guided:

```json
{
  "mode": "guided",
  "display": "emoji",
  "rulesPath": null,
  "repository": {
    "visibility": "unknown"
  },
  "cost": {
    "acknowledgedPaidDependencies": []
  },
  "update": {
    "checkIntervalDays": 7
  },
  "autoFix": {
    "envGitignore": true,
    "envExample": true,
    "simpleSecretQuarantine": true
  }
}
```

After reviewing an existing paid or quota-based package, add its exact package
name to `cost.acknowledgedPaidDependencies`:

```json
{
  "cost": {
    "acknowledgedPaidDependencies": [
      "@aws-sdk/client-s3",
      "@google-cloud/bigquery",
      "firebase",
      "firebase-admin"
    ]
  }
}
```

Acknowledgement records that the dependency received a human cost review. It
does not remove the package, match related package names, disable other Cost
findings, or weaken `--strict`. Any unacknowledged or newly added paid
dependency continues to produce a warning.

## Site

A static bilingual product page lives in [site/](site/) and is intended for:

```text
https://vibeguard.thdev.app
```

For local preview, open [site/index.html](site/index.html) directly in a
browser.

## Docs

- [Korean guide](docs/ko.md)
- [Agent bootstrap](docs/agent-bootstrap.md)
- [Execution evidence](docs/execution-evidence.md)
- [Guard scope](docs/guard-scope.md)
- [Localization strategy](docs/localization.md)
- [Open source security](docs/open-source-security.md)
- [Product direction](docs/product-direction.md)
- [Release policy](docs/release.md)
- [Server-to-client security](docs/server-client-security.md)

## Release

npm releases are published by GitHub Actions when a matching GitHub Release is
published, not from a local machine. Keep npm credentials out of the repository,
chat, issues, docs, and logs. The first publish may use a temporary `NPM_TOKEN`
only as a protected `npm-release` environment secret because npm trusted
publishing requires the package to exist first. Remove that token immediately
after the first publish, then use GitHub Actions OIDC trusted publishing for
future releases.
