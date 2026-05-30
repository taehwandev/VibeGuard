# VibeGuard Project Instructions

This project builds a small CLI safety layer for non-developers using AI coding
agents.

## Local Rules

- Keep the first version dependency-free unless a dependency removes meaningful
  risk or complexity.
- Prefer deterministic local checks before model-based judgment.
- Never print detected secret values in command output, tests, docs, or examples.
- Treat user-pasted secrets in chat as exposed. Do not reuse them in commands,
  logs, files, GitHub secrets, deployment settings, or servers; guide the user
  to rotate them and enter new values only through local provider UI or
  secret-store prompts.
- Treat auto-fixes as safety fixes: ignored env files, example env files, and
  simple hard-coded secret quarantine only.
- Treat cost-aware architecture as a core guardrail: generated instructions
  should push agents to prefer existing code, local/static behavior,
  server-side reuse, caching, batching, and rate limits before adding paid
  services or recurring infrastructure.
- For web-app guidance, prefer common server-side helpers/endpoints for repeated
  API, provider, or model calls; add server-side caching, batching, and rate
  limits before recommending more client-side calls or new infrastructure.
- Treat Git remote safety as a guardrail. Before commit or push, verify the
  actual remote target, repository visibility, and changed files. Public or
  unknown-visibility repositories require extra care for credentials, env files,
  deployment, infrastructure, and paid-service changes.
- Keep generated prompts actionable for AI coding agents, not educational essays.

## Verification

- Run `npm test` after changing scanner, fixer, prompt, or CLI behavior.
- Run `node src/cli.js --help` after changing CLI parsing or command output.
- Run `node src/cli.js audit . --strict` before committing or pushing release
  changes.
- Run `npm pack --dry-run` before package publication changes.

## AgentPlaybook Routing

- Keep VibeGuard as the safety gate for secrets, cost, data, deployment, and
  repository risk.
- Use AgentPlaybook only as the external execution playbook for planning,
  implementation, verification, review, and handoff.
- AgentPlaybook root placeholder: `<AGENTPLAYBOOK_ROOT>`. In this workspace it
  normally resolves to `~/Documents/KeyFlowVault/AgentPlaybook`; do not
  hard-code `/Users/<name>/...` paths.
- Do not clone or download AgentPlaybook from this repo's instructions. If the
  root is missing or unknown, ask the user for the existing managed copy
  location.
- Do not merge, vendor, or copy AgentPlaybook content into this repo. If rules
  conflict, this `AGENTS.md` and `VIBEGUARD.md` take precedence.
- For multi-step work, route before editing:
  `python3 <AGENTPLAYBOOK_ROOT>/scripts/workflow.py route <command> --request "<request>"`.
- When wrappers are available, run `agent-preflight.py` before edits and
  `agent-finish-check.py` before final report, commit, release, or handoff.
- Apply current guardrails with audit-only by default:
  `npx --yes @taehwandev/vibeguard@latest audit . --rules <AGENTPLAYBOOK_ROOT>`.
  Run VibeGuard setup or update only after explicit user approval to create or
  refresh managed guardrail blocks.
- Use human-facing gate signals from the route ledger:
  `🐱🔵 PENDING`, `🐱🟢 GREEN`, `🐱🟡 YELLOW`, `🐱🔴 RED`.
