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
- Reuse the existing shared AgentPlaybook root from `${AGENTPLAYBOOK_HOME}`.
  Do not hard-code personal absolute paths in committed repo instructions.
- Do not clone, download, vendor, copy, or pin AgentPlaybook from this repo's
  instructions. If `${AGENTPLAYBOOK_HOME}` is unset or the root is missing, ask
  the user for the existing managed copy location before continuing.
- Do not merge, vendor, or copy AgentPlaybook content into this repo. If rules
  conflict, this `AGENTS.md` and `VIBEGUARD.md` take precedence.
- For multi-step work, route before editing:
  `python3 "${AGENTPLAYBOOK_HOME}/scripts/workflow.py" route <command> --request "<request>"`.
- When wrappers are available, run `agent-preflight.py` before edits and
  `agent-finish-check.py` before final report, commit, release, or handoff.
- Apply current guardrails with audit-only by default:
  `vibeguard audit . --rules "${AGENTPLAYBOOK_HOME}"`.
  Use `npx --yes @taehwandev/vibeguard@latest audit . --rules
  "${AGENTPLAYBOOK_HOME}"` only when no trusted installed binary is available
  or when explicitly validating the latest published package.
  Run VibeGuard setup or update only after explicit user approval to create or
  refresh managed guardrail blocks.
- Do not make repeated local hooks depend on `npx` first; npm registry lookup
  can block the hook before VibeGuard itself starts.
- Use only these human-facing route gate signals:
  `🐱🟢 SUCCESS` and `🐱🔴 FAIL`.

<!-- vibeguard:start version=1 -->
## VibeGuard

For every task that may change code, configuration, dependencies, data,
deployment, or credentials:

1. Run `vibeguard audit .` before editing.
2. If the audit reports stale VibeGuard guardrails, run `npx --yes @taehwandev/vibeguard@latest update .` once, then rerun `vibeguard audit .`. The default refresh interval is 7 days; do not update more often unless the user asks or the audit reports stale guardrails.
3. If `vibeguard` is unavailable, run `npx --yes @taehwandev/vibeguard@latest audit .` instead and use the same `npx --yes @taehwandev/vibeguard@latest ...` form for fixes.
4. If fixable findings exist, run `vibeguard audit . --fix` before implementing.
5. Never print detected secret values. Keep real secrets only in ignored runtime env files and keep env templates such as `.env.example` and `.env.sample` value-free.
6. Ask before deleting data, running migrations, deploying to production, increasing paid API/model usage, adding recurring infrastructure, or changing credentials.
7. Prefer cost-aware architecture. Before adding a paid service, database, queue, background worker, model call, analytics SDK, or cloud resource, explain why existing code or a simpler local/server-side design is insufficient.
8. For web apps, commonize repeated API/model/provider calls behind shared server-side helpers or endpoints. Prefer server-side caching, batching, and rate limits before adding new client-side call paths.
9. Before commit or push, verify `git remote -v`, repository visibility, and changed files. If the repository is public or visibility is unknown, stop before pushing secrets, env files, credentials, deployment, infrastructure, or paid-service changes.
10. After editing, run relevant tests and `vibeguard audit .` again before finishing.
11. Before creating a commit, run `vibeguard audit .`; before pushing or publishing, run `vibeguard audit . --strict`.
12. If execution evidence is available, run `vibeguard evidence .` before the final response and do not claim tests or audits ran unless they were observed.
13. Keep secrets server-side. Do not expose provider keys, database URLs, signing secrets, service-role keys, or webhook secrets to client code.
14. If the user pastes a secret in chat, treat it as exposed. Do not repeat it, put it in commands/logs/files/GitHub secrets/deployment settings/servers, or continue with deployment using that value. Guide the user to rotate it and enter a new value only through a local provider UI or secret-store prompt.
15. Keep VibeGuard scoped to guardrails. Do not clone, vendor, install, or link external playbooks or rule libraries unless the user explicitly asks for that separate setup.
16. Preserve existing repo-local instructions. Only update the managed VibeGuard block between the `vibeguard:start` and `vibeguard:end` markers.

Refresh this managed block only when `vibeguard audit .` reports stale guardrails, or manually with `vibeguard update .` / `npx --yes @taehwandev/vibeguard@latest update .`.
<!-- vibeguard:end -->
