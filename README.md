# Vibe-Guard

Vibe-Guard is a local preflight safety checker for non-developers using AI coding
agents. It scans a project before coding, auto-fixes low-risk safety gaps, and
installs agent instructions so Cursor, Claude, Codex, or ChatGPT can follow the
same safety workflow without a long prompt from the user.

## For AI Coding Agents

If a user gives you this repository link, do not ask them to learn Vibe-Guard.
Apply it to their current project.

```bash
npm --no-update-notifier exec --yes --package github:taehwandev/VibeGuard -- vibe-guard setup .
npm --no-update-notifier exec --yes --package github:taehwandev/VibeGuard -- vibe-guard audit . --fix
npm --no-update-notifier exec --yes --package github:taehwandev/VibeGuard -- vibe-guard audit .
```

Then continue with the user's original coding request. Do not print secret
values, and ask before destructive, costly, production, or credential-related
work. See [docs/agent-bootstrap.md](docs/agent-bootstrap.md) for the full
agent-facing flow.

## User Flow

The intended user experience is:

```text
Apply https://github.com/taehwandev/VibeGuard to this project.
```

The AI agent should read this repo, install or refresh the project guardrails,
run the safe checks, and continue without requiring the user to understand the
tooling.

## MVP Scope

- Detect likely hard-coded secrets without printing secret values.
- Add safe `.gitignore` rules for local env files.
- Generate `.env.example` from detected secret names.
- Quarantine simple JS/TS/Python hard-coded secret assignments with `--fix`.
- Install or update a managed `AGENTS.md` safety block for AI coding agents.
- Flag oversized files, risky scripts, missing repo config, and data/cost risks.
- Load an external agent rule library, such as:

```text
~/Documents/KeyFlowVault/agent
```

## Install For Local Testing

```bash
cd ~/GitHub/vibe-guard
npm link
```

Then run it in any project:

```bash
vibe-guard setup ~/GitHub/my-project --rules ~/Documents/KeyFlowVault/agent
vibe-guard audit ~/GitHub/my-project
vibe-guard audit ~/GitHub/my-project --fix
vibe-guard prompt ~/GitHub/my-project --request "Add login"
```

Without linking:

```bash
node ~/GitHub/vibe-guard/src/cli.js audit ~/GitHub/my-project --fix
```

Directly from this GitHub repo:

```bash
npm --no-update-notifier exec --yes --package github:taehwandev/VibeGuard -- vibe-guard setup .
```

## Commands

### `init` / `setup` / `update`

Creates or updates `VIBEGUARD.md`, `.vibeguard.json`, a managed `AGENTS.md`
Vibe-Guard block, and safe env ignore rules in the target project.

```bash
vibe-guard setup . --rules ~/Documents/KeyFlowVault/agent
vibe-guard update .
```

After setup, the user can ask their AI coding agent normally. The managed agent
instructions tell the agent to run Vibe-Guard before editing, auto-fix safe
issues, and ask before destructive, costly, or credential-related work.

### `audit`

Prints a traffic-light report.

```bash
vibe-guard audit .
vibe-guard audit . --json
```

### `audit --fix`

Applies low-risk safety fixes:

- Ensures `.env`, `.env.*`, and `.env.vibeguard.local` are ignored.
- Keeps `.env.example` unignored.
- Writes detected variable names to `.env.example`.
- Moves simple hard-coded JS/TS/Python secret values to `.env.vibeguard.local`.
- Replaces those values with environment-variable reads.

### `prompt`

Builds an AI-agent prompt that tells the agent how to proceed safely. This is
mainly useful for manual workflows or future integrations; the default path is
to rely on the managed project instructions installed by `setup`.

```bash
vibe-guard prompt . --request "Add Stripe checkout"
```

## Product Direction

The CLI is the first layer. Later versions can become:

- a VS Code/Cursor extension,
- a pre-commit hook,
- a desktop app,
- or an MCP server that coding agents call before editing.

Agent-facing documents and generated prompts are kept in English by default.
Localized distribution material should live separately; see
[docs/localization.md](docs/localization.md).
