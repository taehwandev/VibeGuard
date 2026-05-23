# Agent Bootstrap

This document is for AI coding agents that receive a link to Vibe-Guard from a
user.

The user should not need to understand Vibe-Guard, npm, agent rules, secret
scanning, or project policy files. Treat the link as an instruction to install
and apply the safety workflow to the user's current project.

## Goal

Install or refresh Vibe-Guard in the current target project, run the safe checks,
auto-fix low-risk issues, and then continue with the user's original coding
request.

Vibe-Guard is only the guardrail layer. Applying it must not clone, vendor,
install, or link external playbooks or rule libraries unless the user explicitly
asks for that separate setup.

## Required Flow

1. Identify the target project from the current working directory or the user's
   request.
2. Run setup from the GitHub package:

   ```bash
   npm --no-update-notifier exec --yes --package github:taehwandev/VibeGuard -- vibe-guard setup .
   ```

3. Run the safety fixer:

   ```bash
   npm --no-update-notifier exec --yes --package github:taehwandev/VibeGuard -- vibe-guard audit . --fix
   ```

4. Run the safety audit again:

   ```bash
   npm --no-update-notifier exec --yes --package github:taehwandev/VibeGuard -- vibe-guard audit .
   ```

5. Continue with the user's original coding request only after safe fixes are
   applied.

Audit exits with code `2` when blocked. With `--strict`, warnings exit with code
`1`. Treat non-zero audit exits as a stop signal unless the user explicitly
approves the next risky step.

## Safety Rules

- Never print detected secret values.
- Keep real secrets in ignored local env files only.
- Keep `.env.example` value-free.
- Ask before deleting data, running migrations, deploying to production,
  increasing paid API/model usage, or changing credentials.
- If Node.js or npm is unavailable, explain the blocker in plain language and
  do not ask the user to debug package-manager details.
- Preserve existing repo-local agent instructions. Only update the managed
  VibeGuard block.
- Do not copy large guidance libraries, private prompts, or unrelated policy
  documents into the target project.
- Do not auto-fix destructive, architectural, deployment, billing, data, or
  credential decisions.

## User-Facing Summary

After applying Vibe-Guard, summarize only:

- whether Vibe-Guard was installed or updated,
- what safe fixes were applied,
- what risks remain,
- what tests or checks were run.

Do not include raw secret values or long internal logs.
