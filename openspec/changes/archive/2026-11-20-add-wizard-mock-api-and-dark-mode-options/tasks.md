# Tasks

## 1. Backoffice: products data source

- [x] 1.1 Move the supermarket seed to `public/mock/products.json` and make `mock/server.mjs` read it
- [x] 1.2 Turn `ProductsService` into a contract and add `HttpProductsService` (current behavior) and `JsonProductsService` (fetch once, in-memory create/update/delete); select by `environment.api.mode` in `app.config.ts`
- [x] 1.3 Add `api.mode` to the environment files (`http` by default, `json` never in prod unless chosen) and unit tests for `JsonProductsService`
- [x] 1.4 Add `scripts/remove-mock-api.mjs` and `npm run remove:mock-api` (sets `api.mode: 'json'`, deletes `mock/server.mjs`, removes the `mock:api` script, the dev proxy and the Playwright mock `webServer` entry; fails loudly if a block is not found) with a test
- [x] 1.5 Make `e2e/products.spec.ts` pass in both modes (no persistence assumptions across reloads)

## 2. Dark mode in both templates

- [x] 2.1 Add `theme.darkMode` (default `false`) to the environment files of both templates
- [x] 2.2 Add a `ThemeToggle` component using `CotoThemeService`, shown in the header only when the flag is true; force light at startup when it is false; keep SSR safe in the public template
- [x] 2.3 Add `scripts/configure-theme.mjs` and `npm run configure:theme` to each template, with tests
- [x] 2.4 Unit tests for the toggle (enabled, disabled, stale stored `dark`) and e2e coverage of the toggle when enabled

## 3. CLI wizard

- [x] 3.1 Add the `--no-mock-api` and `--dark-mode` flags to `run.js` and the help text; reject `--no-mock-api` for the public template
- [x] 3.2 Add the mock API question (with an explanatory message in Spanish) for backoffice and the dark mode question for both types in `wizard.js`; defaults without a terminal
- [x] 3.3 Run `remove-mock-api` and `configure-theme` from `generate.js` as steps, and list the chosen options in the summary
- [x] 3.4 Update the CLI tests (`wizard`, `run`, `generate`) for the new questions, flags and defaults

## 4. Docs and verification

- [x] 4.1 Update both READMEs and `CLAUDE.md` files (mock API vs JSON mode, dark mode flag, new scripts) and the root README wizard section
- [x] 4.2 Extend `scripts/verify-templates.mjs` to also verify a backoffice generated with `--no-mock-api --dark-mode` (install, lint, test, build, e2e)
- [x] 4.3 Run `npm run verify`
