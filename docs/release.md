# Release Policy

VibeGuard uses calendar-style release numbers:

```text
YY.WW.N
```

- `YY`: two-digit year
- `WW`: ISO week number
- `N`: release count within that week, starting at `0`

Examples:

```text
26.21.0
26.21.1
26.22.0
```

## Current Release

Do not calculate the release number by hand. Use the release script:

```bash
npm run release:version
```

To calculate from a specific date:

```bash
npm run release:version -- --date 2026-05-23
```

For 2026-05-23, the script returns:

```text
26.21.0
```

To write the computed version into `package.json`:

```bash
npm run release:prepare
```

## GitHub Release Flow

Do not publish npm releases from a local machine. Releases are published by the
GitHub Actions workflow in `.github/workflows/publish-npm.yml`.

Use the release number as the package version. Use a `v` prefix for Git tags:

```text
package: vibeguard@26.21.0
git tag: v26.21.0
```

Release steps:

1. Ensure the working tree is clean.
2. Run `npm test`.
3. Run `node src/cli.js audit . --strict`.
4. Run `npm pack --dry-run`.
5. Push `main`.
6. Push the matching release tag, for example `v26.21.0`.

The workflow verifies the tag matches `package.json`, runs tests and strict
audit, checks package contents, then publishes to npm.

## npm Authentication

Use npm Trusted Publishing with GitHub Actions OIDC. Configure npm's trusted
publisher for:

- Owner: `taehwandev`
- Repository: `VibeGuard`
- Workflow filename: `publish-npm.yml`
- Environment: `npm-release`
- Allowed action: `npm publish`

`npm trust` currently requires the package to already exist on the npm registry.
For the first publish only, use a temporary automation token stored as an
environment secret, not as a repository file:

```bash
gh secret set NPM_TOKEN --repo taehwandev/VibeGuard --env npm-release
```

The `npm-release` environment must require a reviewer before publish jobs can
access environment secrets. This keeps a pushed release tag from automatically
using the first-publish token without human approval.

Then rerun the failed `v26.21.0` publish workflow. The workflow uses that token
only for the first-publish step and uses the OIDC trusted-publishing step when
the token is absent. Do not paste the token into chat, docs, issues, commits,
terminal logs, or `.npmrc`.

Immediately after the first publish succeeds, configure trusted publishing:

```bash
npm trust github vibeguard --file publish-npm.yml --repo taehwandev/VibeGuard --env npm-release
```

Then remove the temporary secret and revoke/delete the npm token:

```bash
gh secret delete NPM_TOKEN --repo taehwandev/VibeGuard --env npm-release
```

Future releases must use GitHub Actions OIDC. Keep the workflow's `id-token:
write` permission enabled.

## Rules

- Increment `N` for multiple releases in the same ISO week.
- Reset `N` to `0` when the ISO week changes.
- The script reads existing `vYY.WW.N` Git tags and chooses the next release
  count for the current ISO week.
- Do not use semantic-version meaning for major, minor, and patch. The version
  is calendar release metadata.
