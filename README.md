# Vibe-Guard

Vibe-Guard is a safety layer for AI coding agents.

Give an agent this link, and it should install project guardrails, fix low-risk
safety gaps, run checks, and then continue with the user's original coding task.

```text
Apply https://github.com/taehwandev/VibeGuard to this project.
```

## Agent Bootstrap

If you are an AI coding agent and a user gives you this repository link, apply it
to the current project. Do not ask the user to learn Vibe-Guard.

```bash
npm --no-update-notifier exec --yes --package github:taehwandev/VibeGuard -- vibe-guard setup .
npm --no-update-notifier exec --yes --package github:taehwandev/VibeGuard -- vibe-guard audit . --fix
npm --no-update-notifier exec --yes --package github:taehwandev/VibeGuard -- vibe-guard audit .
```

Then continue with the user's original request. Never print detected secret
values, and ask before destructive, costly, production, or credential-related
work.

Full flow: [docs/agent-bootstrap.md](docs/agent-bootstrap.md)

## CLI

```bash
vibe-guard setup .
vibe-guard audit .
vibe-guard audit . --fix
vibe-guard prompt . --request "Add login"
```

Language can be selected with `--lang` or `VIBEGUARD_LANG`.

```bash
vibe-guard audit . --lang en
vibe-guard audit . --lang ko
VIBEGUARD_LANG=ko vibe-guard audit .
```

Supported languages: `en`, `ko`.

## What It Does

- Installs a managed `AGENTS.md` safety block.
- Adds safe env ignore rules.
- Creates value-free `.env.example` files.
- Detects likely hard-coded secrets without printing secret values.
- Quarantines simple JS/TS/Python hard-coded secrets with `--fix`.
- Flags risky scripts, oversized files, paid integrations, and data/cost risks.
- Stays scoped to guardrails; it does not install or link external playbooks by
  default.

## Site

A static bilingual product page lives in [site/](site/). Open
[site/index.html](site/index.html) directly in a browser.

## Docs

- [Agent bootstrap](docs/agent-bootstrap.md)
- [Guard scope](docs/guard-scope.md)
- [Localization strategy](docs/localization.md)
- [Product direction](docs/product-direction.md)
