# Product Direction

## Positioning

VibeGuard is an AI coding safety layer for non-developers.

It should not behave like a lecture. It should:

1. inspect the project,
2. fix safe issues automatically,
3. block dangerous work,
4. push the agent toward cost-aware architecture before it adds paid services or
   recurring infrastructure,
5. verify Git remote target, repository visibility, and changed files before
   commit or push,
6. install persistent agent instructions so the user does not need to write a
   careful safety prompt every time.

It should stay a guard. It must not become an installer or router for external
playbooks by default.

## First Useful User Flow

```text
User gives the VibeGuard GitHub link to an AI coding agent
-> Agent reads the repo bootstrap instructions
-> Agent runs setup in the user's current project
-> VibeGuard installs project policy and managed agent instructions
-> User types a normal request
-> Agent runs VibeGuard before editing
-> VibeGuard fixes safe setup gaps
-> Agent implements with guardrails
-> Agent runs VibeGuard again before finishing
```

## Install And Update Model

The default product behavior should be "install once, then stay out of the
user's way."

- `vibeguard setup .` installs the project policy, config, env protection, and
  managed `AGENTS.md` block.
- `vibeguard update .` reruns the same idempotent setup path and refreshes the
  VibeGuard managed block, config defaults, hooks, and local update-check state.
- Agents should prefer the published npm package form:
  `npx --yes @taehwandev/vibeguard@latest ...`.
- The default update TTL is 7 days. `vibeguard audit .` should warn when the
  local update-check state is stale, and the agent should run
  `npx --yes @taehwandev/vibeguard@latest update .` once before continuing.
- Commit and push hooks should not run `update .` themselves because hooks
  should not mutate tracked files during commit or push.
- The GitHub repository link remains the human-friendly instruction anchor, but
  the agent should use npm once the package is available.
  That keeps the tool current without requiring the user to understand global
  installs.
- `prompt` remains available for manual use and future integrations, but it is
  not the primary UX.
- Agent-facing documents should stay in English. CLI output, generated prompts,
  and distribution pages can be localized with explicit language selection; see
  `docs/localization.md`.
- External playbooks or rule libraries are separate products. VibeGuard may
  read an explicitly configured rule source, but setup should not clone, vendor,
  install, or link one by default.

## Link-Only Principle

The user should be able to paste only this link into an AI coding agent:

```text
https://github.com/taehwandev/VibeGuard
```

The agent should infer that it needs to install or refresh VibeGuard in the
current project, run the safety workflow, and continue the user's original task.

## MVP Principle

Prefer deterministic checks over expensive AI judgment. Add model-based judgment
later as an optional layer for ambiguous architecture or product-risk decisions.

## Cost-Aware Architecture Principle

VibeGuard should not encourage agents to solve every request by attaching more
services. Before an agent adds a paid API, model call, analytics SDK, database,
queue, background worker, scheduled job, storage bucket, or cloud resource, it
should first consider existing code, static/local behavior, server-side reuse,
caching, batching, rate limits, and clear budget boundaries.

If a recurring cost or operational burden is introduced, the agent should explain
why the simpler path is insufficient and ask for approval before implementation.

For typical web projects, the default recommendation should be:

- commonize repeated API/model/provider access behind shared server-side helpers
  or endpoints,
- keep provider SDK setup and privileged calls server-side,
- keep development, staging, and production URLs, API origins,
  redirect/callback URLs, and asset hosts in platform config instead of
  hard-coded source values,
- cache stable or slow-changing data on the server,
- batch repeated requests and add rate limits before exposing expensive paths,
- avoid duplicating client-side fetching logic across components when one shared
  access path is enough.
