# Guard Scope

VibeGuard is a guard, not a playbook installer.

Its job is to reduce avoidable damage before an AI coding agent changes a
project. It should inspect local state, apply narrow safe fixes, and stop risky
work for approval.

## Responsibilities

- Install or refresh the VibeGuard-managed safety block in repo-local agent
  instructions.
- Preserve existing project instructions outside the managed VibeGuard block.
- Protect local env files and keep `.env.example` value-free.
- Detect likely hard-coded secrets without printing the values.
- Quarantine simple hard-coded JS/TS/Python secret assignments when `--fix` is
  requested.
- Install or refresh local Git `pre-commit` and `pre-push` safety hooks when the
  target project is a Git repository.
- Check Git remote naming, configured repository visibility, and changed files
  before commit or push.
- Record optional execution evidence from supported agent hooks.
- Keep server-only secrets from being moved into client code or public bundles.
- Warn or block before destructive scripts, database work, production deploys,
  credential changes, paid API/model usage, and oversized edits.
- Block sensitive Git changes when repository visibility is public or unknown;
  warn on similar-but-not-exact remote names and public deployment or
  infrastructure changes.
- Push agents toward cost-aware architecture before they add paid services,
  recurring infrastructure, model calls, queues, background workers, analytics
  SDKs, or new databases.
- For web projects, push agents to commonize repeated provider access behind
  shared server-side helpers or endpoints and to use server-side caching,
  batching, and rate limits before adding more client-side calls.
- Report changed files, verification evidence, and remaining risk.

## Non-Responsibilities

- Do not clone, vendor, install, or link AgentPlaybook or any other external
  playbook by default.
- Do not copy large guidance libraries into a target repository.
- Do not replace project-specific agent instructions, coding conventions,
  architecture docs, or product policy.
- Do not turn ambiguous product work into implementation without a clear user
  request.
- Do not auto-fix destructive, architectural, deployment, billing, data, or
  credential decisions.
- Do not add recurring infrastructure or paid dependencies by default when
  existing code, a local/static path, server-side reuse, caching, batching, or
  rate limits can satisfy the request.
- Do not duplicate client-side fetching, paid provider calls, or model calls in
  multiple components when a shared server-side access path can handle it.
- Do not claim full agent control, rollback, or retry enforcement from execution
  evidence alone.

## Boundary Rule

VibeGuard may read an optional configured rule source when the user or project
explicitly provides one, but setup must remain a guardrail installation flow. A
separate playbook connection flow belongs outside VibeGuard unless the user
explicitly asks for that separate setup.
