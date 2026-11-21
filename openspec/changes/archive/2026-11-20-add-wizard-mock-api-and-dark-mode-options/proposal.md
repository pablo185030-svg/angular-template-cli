# Proposal

## Why

The backoffice always ships a mock API server that many teams do not want, and the wizard does not explain what it is for. Dark mode is available in the ui-kit but neither template exposes it, and teams should choose whether their project supports it.

## What Changes

- The wizard asks, for the backoffice only, whether to include the mock API, with an explanation of what it is, what it gives, and what happens if it is declined. The default is to include it (today's behavior).
- When the mock API is declined, the generated backoffice has no `mock/` server and no `mock:api` script, and the products ABM reads its sample supermarket products from a JSON file and keeps create/edit/delete changes in browser memory (lost on reload). Switching to a real backend means replacing that data source.
- For both templates, the wizard asks whether to support dark mode, default no. With no, the project is light-only. With yes, the project supports both themes, starts in light mode, and the header shows a toggle (persisted by the ui-kit's `CotoThemeService`).
- New CLI flags: `--no-mock-api` and `--dark-mode`, so the answers can be given without prompts. Without a terminal the defaults apply (mock API included, light only).
- Spanish wizard text, English code and docs, as today.

## Capabilities

### New Capabilities

### Modified Capabilities
- `cli-wizard`: two new questions (mock API for backoffice, dark mode for both) and their flags.
- `backoffice-template`: optional mock API with a JSON data source fallback, and optional dark mode.
- `public-template`: optional dark mode.

## Impact

- `cli/src/wizard.js`, `run.js`, `generate.js`, `ui.js` (summary) and `cli/test/*`.
- Backoffice: products data source abstraction (HTTP vs JSON), `mock/` seed moved to a shared JSON file, environment files, `package.json`, `playwright.config.ts`, `proxy.conf.json`, header, README and `CLAUDE.md`.
- Public and backoffice: environment flag for dark mode, header theme toggle, `styles.scss`, tests, README and `CLAUDE.md`.
- `scripts/verify-templates.mjs` should keep verifying the default and the declined variants.
