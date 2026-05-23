# Release Policy

Vibe-Guard uses calendar-style release numbers:

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

## Tags

Use the release number as the package version. Use a `v` prefix for Git tags:

```text
package.json: 26.21.0
git tag: v26.21.0
```

## Rules

- Increment `N` for multiple releases in the same ISO week.
- Reset `N` to `0` when the ISO week changes.
- The script reads existing `vYY.WW.N` Git tags and chooses the next release
  count for the current ISO week.
- Do not use semantic-version meaning for major, minor, and patch. The version
  is calendar release metadata.
