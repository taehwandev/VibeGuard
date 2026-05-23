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

Prefer npm Trusted Publishing with GitHub Actions OIDC. Configure npm's trusted
publisher for:

- Owner: `taehwandev`
- Repository: `VibeGuard`
- Workflow filename: `publish-npm.yml`
- Environment: `npm-release`
- Allowed action: `npm publish`

For a first publish, npm may require a temporary automation token because the
package does not exist yet. If needed, store it only as the GitHub Actions
secret `NPM_TOKEN`. Never commit `.npmrc`, raw tokens, OTP values, or registry
auth lines. After trusted publishing is configured and verified, remove the
temporary token from GitHub and npm.

## Rules

- Increment `N` for multiple releases in the same ISO week.
- Reset `N` to `0` when the ISO week changes.
- The script reads existing `vYY.WW.N` Git tags and chooses the next release
  count for the current ISO week.
- Do not use semantic-version meaning for major, minor, and patch. The version
  is calendar release metadata.
