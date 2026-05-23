# VibeGuard Project Instructions

This project builds a small CLI safety layer for non-developers using AI coding
agents.

## Local Rules

- Keep the first version dependency-free unless a dependency removes meaningful
  risk or complexity.
- Prefer deterministic local checks before model-based judgment.
- Never print detected secret values in command output, tests, docs, or examples.
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
