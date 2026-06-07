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

## Artifacts And Deployment Targets

VibeGuard has two production surfaces:

- CLI package: `@taehwandev/vibeguard` on npm.
- Static website: GitHub Pages from `site/`.

The CLI does not have a separate compile or bundle step. `package.json` exposes
`src/cli.js` directly through the `bin` field, so the production artifact check
is package assembly:

```bash
npm pack --dry-run
```

Use this as the production build equivalent for CLI release work. It verifies
which files would ship in the npm tarball without publishing anything.

The static website is not part of the npm release. Changes under `site/` deploy
through `.github/workflows/deploy-pages.yml` when they are pushed to `main`, or
when that workflow is run manually. Documentation-only or CLI-only changes do
not trigger a Pages deploy unless `site/` or the Pages workflow changed.

## GitHub Release Flow

Do not publish npm releases from a local machine. npm releases are published by
the GitHub Actions workflow in `.github/workflows/publish-npm.yml` when a
matching GitHub Release is published.

Use the release number as the package version. Use a `v` prefix for Git tags:

```text
package: @taehwandev/vibeguard@26.21.0
git tag: v26.21.0
```

Release steps:

1. Ensure the working tree is clean.
2. Run `npm test`.
3. Run `node src/cli.js audit . --strict`.
4. Run `npm pack --dry-run`.
5. Push `main`.
6. Push the matching release tag, for example `v26.21.0`.
7. Publish a GitHub Release for that tag.

The workflow checks out the GitHub Release tag, verifies it matches
`package.json`, runs tests and strict audit, checks package contents, then
publishes to npm.

If `node src/cli.js audit . --strict` reports stale guardrails, run the approved
VibeGuard update flow first, then rerun the strict audit. If it reports a
structural warning, either fix the structure before release or record the
accepted release risk before tagging.

## Website Deployment Flow

The website deploy is GitHub Pages, not npm. Use it only for `site/` changes or
Pages workflow changes:

1. Review the `site/` diff.
2. Run a narrow static smoke check by opening or serving `site/index.html` when
   practical.
3. Push the change to `main`.
4. Confirm the `Deploy Pages` workflow succeeds.

The workflow uploads the `site/` directory as the Pages artifact and deploys it
to the configured GitHub Pages environment.

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

Publish a GitHub Release for the matching tag. The workflow uses that token only
for the first-publish step and uses the OIDC trusted-publishing step when the
token is absent. Do not paste the token into chat, docs, issues, commits,
terminal logs, or `.npmrc`.

Immediately after the first publish succeeds, configure trusted publishing:

```bash
npm trust github @taehwandev/vibeguard --file publish-npm.yml --repo taehwandev/VibeGuard --env npm-release --allow-publish
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
