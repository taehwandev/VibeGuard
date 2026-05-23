# Agent Bootstrap

This document is for AI coding agents that receive a link to VibeGuard from a
user.

The user should not need to understand VibeGuard, npm, agent rules, secret
scanning, or project policy files. Treat the link as an instruction to install
and apply the safety workflow to the user's current project.

## Goal

Install or refresh VibeGuard in the current target project, run the safe checks,
auto-fix low-risk issues, and then continue with the user's original coding
request.

VibeGuard is only the guardrail layer. Applying it must not clone, vendor,
install, or link external playbooks or rule libraries unless the user explicitly
asks for that separate setup.

## Required Flow

1. Identify the target project from the current working directory or the user's
   request.
2. Run setup from the GitHub package:

   ```bash
   npx --yes @taehwandev/vibeguard setup .
   ```

3. Run the safety fixer:

   ```bash
   npx --yes @taehwandev/vibeguard audit . --fix
   ```

4. Run the safety audit again:

   ```bash
   npx --yes @taehwandev/vibeguard audit .
   ```

5. Continue with the user's original coding request only after safe fixes are
   applied.

Setup installs local `pre-commit` and `pre-push` hooks when the target project
is a Git repository. The commit hook runs `vibeguard audit .`; the push hook
runs `vibeguard audit . --strict`.

The audit also checks Git remote safety. Before commit or push, confirm the
actual remote target with `git remote -v`, confirm whether the repository is
public, private, internal, or unknown, and review changed files. If visibility
is public or unknown, stop before pushing credentials, env files, deployment
configuration, infrastructure, migrations, or paid-service changes.

When an agent hook adapter is available, record execution evidence and summarize
it with `vibeguard evidence .` before final reporting. Do not claim that tests,
audits, builds, or typechecks ran unless they appear in the execution evidence
or in the current terminal history.

For Claude Code, install the local evidence adapter when the user or project
allows tool hooks:

```bash
vibeguard evidence install-claude-hook .
```

Audit exits with code `2` when blocked. With `--strict`, warnings exit with code
`1`. Treat non-zero audit exits as a stop signal unless the user explicitly
approves the next risky step.

## Safety Rules

- Never print detected secret values.
- If the user pastes a secret in chat, treat it as exposed. Do not repeat it,
  place it in commands, logs, files, GitHub secrets, deployment settings, or any
  server. Guide the user to rotate it and enter a new value only through a local
  provider UI or secret-store prompt.
- Keep real secrets in ignored local env files only.
- Keep `.env.example` value-free.
- Keep provider keys, database URLs, service-role keys, signing secrets, and
  webhook secrets server-side only.
- Ask before deleting data, running migrations, deploying to production,
  increasing paid API/model usage, or changing credentials.
- Confirm Git remote target, repository visibility, and changed files before
  commit or push. Treat public or unknown visibility as higher risk.
- Use cost-aware architecture. Before adding a paid service, database, queue,
  background worker, model call, analytics SDK, or cloud resource, check whether
  existing code, a local/static path, server-side reuse, caching, batching, or
  rate limits solve the request with less recurring cost.
- For web apps, centralize repeated API/model calls, paid provider access, and
  SDK setup behind shared server-side helpers or endpoints. Prefer server-side
  caching for stable or slow-changing data, and add batching/rate limits before
  creating new client-side call paths.
- If Node.js or npm is unavailable, explain the blocker in plain language and
  do not ask the user to debug package-manager details.
- Preserve existing repo-local agent instructions. Only update the managed
  VibeGuard block.
- Do not copy large guidance libraries, private prompts, or unrelated policy
  documents into the target project.
- Do not auto-fix destructive, architectural, deployment, billing, data, or
  credential decisions.
- Do not add recurring infrastructure or paid dependencies just because they are
  convenient. Ask for approval and describe the cheaper alternative first.
- Do not duplicate paid calls or provider setup across UI components. Commonize
  the access path first, then add caching or throttling where useful.

## User-Facing Summary

After applying VibeGuard, summarize only:

- whether VibeGuard was installed or updated,
- what safe fixes were applied,
- what risks remain,
- what tests or checks were run.

Do not include raw secret values or long internal logs.
