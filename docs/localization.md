# Localization Strategy

Vibe-Guard should separate AI-facing instructions from human-facing
distribution copy.

## Canonical Language

English is the canonical language for:

- `README.md`
- `AGENTS.md`
- `VIBEGUARD.md`
- agent bootstrap documents
- generated agent prompts
- machine-readable audit messages and finding recommendations

These documents are primarily read by AI coding agents. English keeps the
workflow easier to parse across different tools and avoids mixing localized
marketing copy with operational safety rules.

## Localized Distribution

Localized content should be added as separate user-facing assets, not mixed into
the canonical agent documents.

Recommended future structure:

```text
docs/locales/
  ko/
    README.md
    quickstart.md
  ja/
    README.md
    quickstart.md
```

Korean should be a first-class distribution language because the initial target
audience includes Korean non-developer users. Other locales can follow the same
structure.

## Runtime Output

The CLI should default to English until localization is implemented. A later
version can add:

- `--lang <locale>`
- `VIBEGUARD_LANG=<locale>`
- stable finding IDs such as `VG-0001`
- locale message files for user-facing summaries

Safety logic must not depend on translated text. Tests should assert stable IDs,
categories, and actions when localization is introduced.
