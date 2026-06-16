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

Git hook file names are fixed by Git, so VibeGuard does not create a competing
hook filename. It installs a named `vibeguard-preflight` managed block inside
the existing hook file. Existing shell hook logic is preserved after the
VibeGuard safety gate. Existing non-shell hooks are moved to a
`.vibeguard-original` sibling and called by a shell wrapper after VibeGuard
passes.

If `vibeguard` is not installed locally, the hook falls back to:

```bash
npx --yes @taehwandev/vibeguard@latest ...
```

This keeps link-only setup usable for non-developers while still refreshing from
the public package source.

Hooks do not run `vibeguard update .` automatically because commit and push
hooks should not mutate tracked project files. VibeGuard instead stores local
update-check state under `.vibeguard/` and uses a 7-day default TTL. When
`vibeguard audit .` reports stale guardrails, run:

```bash
npx --yes @taehwandev/vibeguard@latest update .
```

Then rerun the audit before continuing.

## Repository Target And Visibility

Before commit or push, VibeGuard checks the local Git remote, the configured
repository visibility, and the changed file list.

Git itself does not always expose whether a remote repository is public or
private. VibeGuard treats visibility as:

- `public`: confirmed public repository.
- `private` or `internal`: confirmed non-public repository.
- `unknown`: local Git cannot confirm visibility.

Set visibility explicitly when local Git cannot infer it. Project or local Git
configuration is preferred for developer machines, and the environment variable
is useful for CI systems or temporary local sessions:

```bash
git config vibeguard.repositoryVisibility private
git config vibeguard.repositoryVisibility public
VIBEGUARD_REPOSITORY_VISIBILITY=private vibeguard audit .
```

VibeGuard does not call provider APIs or depend on local provider tokens, CLI
login state, or network access to resolve visibility. It uses explicit
configuration first, then safe CI metadata such as GitLab's
`CI_PROJECT_VISIBILITY` when the metadata matches the current remote.

Confirmed public visibility is treated conservatively. Sensitive changed files
such as `.env`, private keys, service account files, credentials, or secret
config files block the audit. Confirmed private or internal visibility warns for
path-based sensitive Git changes. Unknown visibility stays advisory for
path-based repository checks so providers without local visibility metadata,
such as Bitbucket, do not block commit and push hooks only because visibility
cannot be inferred. Actual secret values found in scanned files are still
blocked by the security scanner.

VibeGuard also warns when the remote repository name is very close to the local
project name but not exact. This catches mistakes such as pushing a local
project to a similarly named public or production repository.

## Key And Secret Rules

- Never commit real API keys, database URLs, private keys, signing secrets,
  service-role keys, webhook secrets, session secrets, or provider tokens.
- Never commit `.npmrc` files containing registry authentication, npm tokens,
  one-time passwords, or GitHub Actions secret values.
- Keep local values in ignored files such as `.env`, `.env.local`, or
  `.env.vibeguard.local`.
- Keep env templates such as `.env.example`, `.env.sample`, `.env.template`, and
  `.env.dist` value-free. They may list names and placeholders, never real
  values.
- Do not print detected secret values in terminal output, docs, tests, issues,
  commits, screenshots, or support messages.
- If a user pastes a secret into AI chat, treat it as exposed. The agent must
  not reuse it in commands, GitHub secrets, deployment settings, server
  configuration, or files. Rotate it and request a fresh value through a local
  provider UI or secret-store prompt.
- Rotate any key that may have been committed, pasted into an agent, uploaded to
  a remote repository, or shown in logs.
- Use deployment secret stores for production values. Do not encode production
  secrets into source files, static assets, Docker images, or build artifacts.

## Release Checklist

Before publishing open source code or packages:

1. Run `vibeguard audit . --fix`.
2. Run `vibeguard audit . --strict`.
3. Run the project test/build checks.
4. Confirm `git remote -v` points to the intended repository.
5. Confirm repository visibility is correct or configure
   `vibeguard.repositoryVisibility`.
6. Inspect `git diff --cached` before commit.
7. Push only after the pre-push hook passes.

npm releases must be published by GitHub Actions from a matching GitHub Release,
not from a local machine. Do not publish from a developer workstation.

For the first npm publish only, store a temporary automation token only as the
protected `npm-release` environment secret named `NPM_TOKEN`. Do not put the
token in repository secrets, `.npmrc`, chat, docs, issues, commits, or logs.
The `npm-release` environment must require reviewer approval before publish
jobs can access its secrets.
After the first publish creates the package on npm, configure GitHub Actions
OIDC trusted publishing with `npm trust github`, remove the `NPM_TOKEN`
environment secret, and revoke/delete the npm token. Future releases must use
trusted publishing rather than a long-lived npm token.

VibeGuard reduces common exposure paths, but it does not replace provider-side
secret scanning, branch protection, code review, or key rotation.
