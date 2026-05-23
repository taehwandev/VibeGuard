# Open Source Security

VibeGuard should protect a project before code leaves a local machine. The
default setup installs both agent instructions and local Git hooks.

## Commit And Push Gates

`vibeguard setup .` installs these managed hooks when the target project is a
Git repository:

- `pre-commit`: runs `vibeguard audit .`
- `pre-push`: runs `vibeguard audit . --strict`

The pre-commit gate blocks known unsafe states such as hard-coded secrets or
unprotected local env files. The pre-push gate is stricter because the next step
may publish code to a remote repository or open source package.

If `vibeguard` is not installed locally, the hook falls back to:

```bash
npx --yes vibeguard ...
```

This keeps link-only setup usable for non-developers while still refreshing from
the public package source.

## Key And Secret Rules

- Never commit real API keys, database URLs, private keys, signing secrets,
  service-role keys, webhook secrets, session secrets, or provider tokens.
- Keep local values in ignored files such as `.env`, `.env.local`, or
  `.env.vibeguard.local`.
- Keep `.env.example` value-free. It may list names, never real values.
- Do not print detected secret values in terminal output, docs, tests, issues,
  commits, screenshots, or support messages.
- Rotate any key that may have been committed, pasted into an agent, uploaded to
  a remote repository, or shown in logs.
- Use deployment secret stores for production values. Do not encode production
  secrets into source files, static assets, Docker images, or build artifacts.

## Release Checklist

Before publishing open source code or packages:

1. Run `vibeguard audit . --fix`.
2. Run `vibeguard audit . --strict`.
3. Run the project test/build checks.
4. Inspect `git diff --cached` before commit.
5. Push only after the pre-push hook passes.

VibeGuard reduces common exposure paths, but it does not replace provider-side
secret scanning, branch protection, code review, or key rotation.
