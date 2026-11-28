# Proposal

## Why

The `public` name is ambiguous: it collides with Angular's `public/` assets folder inside the template and says nothing about what the template is. `website` describes the app type and matches how the wizard already labels it ("Website").

## What Changes

- **BREAKING**: rename `templates/public` to `templates/website`.
- **BREAKING**: the CLI app type value `public` becomes `website` (`--type website`, error messages, help text).
- Rename the main specs `public-template`, `public-seo`, `public-agent-guidance` and `public-web-quality` to `website-*`, and update references to the old names in other specs, READMEs, `CLAUDE.md`, scripts and tests.
- The template's own `public/` assets folder (`robots.txt`, `sitemap.xml`, `llms.txt`) keeps its name.

## Capabilities

### New Capabilities

### Modified Capabilities

No requirement changes: only names and terminology change. The main specs were already updated in place (renamed folders and wording), so this change opts out of delta specs with `skip_specs: true`.

## Impact

- `templates/`, `cli/src`, `cli/test`, `cli/support`, `scripts/verify-templates.mjs`, `README*.md`, `CLAUDE.md`, `openspec/specs/`.
- Anyone invoking the CLI with `--type public` must switch to `--type website`.
- Archived changes keep the old names as history.
