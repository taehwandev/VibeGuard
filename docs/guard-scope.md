# Guard Scope

Vibe-Guard is a guard, not a playbook installer.

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
- Warn or block before destructive scripts, database work, production deploys,
  credential changes, paid API/model usage, and oversized edits.
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

## Boundary Rule

Vibe-Guard may read an optional configured rule source when the user or project
explicitly provides one, but setup must remain a guardrail installation flow. A
separate playbook connection flow belongs outside Vibe-Guard unless the user
explicitly asks for that separate setup.
