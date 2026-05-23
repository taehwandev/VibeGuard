# Localization Strategy

VibeGuard should separate AI-facing instructions from human-facing
distribution copy.

## Canonical Language

English is the canonical language for:

- `README.md`
- `AGENTS.md`
- `VIBEGUARD.md`
- agent bootstrap documents

These documents are primarily read by AI coding agents. English keeps the
workflow easier to parse across different tools and avoids mixing localized
marketing copy with operational safety rules.

Generated prompts, CLI reports, and human-facing summaries can be localized.
They default to English and can be changed with `--lang` or `VIBEGUARD_LANG`.

## Localized Distribution

Localized content should be added as separate user-facing assets, not mixed into
the canonical agent documents.

Recommended structure:

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

The CLI defaults to English and supports:

- `--lang <locale>`
- `VIBEGUARD_LANG=<locale>`

Currently supported locales:

- `en`
- `ko`

Future locale work should add stable finding IDs such as `VG-0001` to the
translation contract and move larger locale dictionaries out of source files if
they grow too large.

Safety logic must not depend on translated text. Tests should assert stable IDs,
categories, and actions when localization is introduced.

## Website

The static site in `site/` includes an English/Korean language selector. It is
for distribution copy and can use more user-friendly localized wording than the
agent-facing docs.
