# Product Direction

## Positioning

Vibe-Guard is an AI coding safety layer for non-developers.

It should not behave like a lecture. It should:

1. inspect the project,
2. fix safe issues automatically,
3. block dangerous work,
4. install persistent agent instructions so the user does not need to write a
   careful safety prompt every time.

## First Useful User Flow

```text
User or agent runs setup once
-> Vibe-Guard installs project policy and managed agent instructions
-> User types a normal request
-> Agent runs Vibe-Guard before editing
-> Vibe-Guard fixes safe setup gaps
-> Agent implements with guardrails
-> Agent runs Vibe-Guard again before finishing
```

## Install And Update Model

The default product behavior should be "install once, then stay out of the
user's way."

- `vibe-guard setup .` installs the project policy, config, env protection, and
  managed `AGENTS.md` block.
- `vibe-guard update .` reruns the same idempotent setup path and refreshes only
  the Vibe-Guard managed block.
- For non-developer usage, agents should prefer `npm exec --yes vibe-guard@latest
  -- ...` when the local command is missing. That keeps the tool current without
  requiring the user to understand global installs.
- `prompt` remains available for manual use and future integrations, but it is
  not the primary UX.

## MVP Principle

Prefer deterministic checks over expensive AI judgment. Add model-based judgment
later as an optional layer for ambiguous architecture or product-risk decisions.
