## Context

The auth mode already works as an environment switch (`auth.mode: 'mock' | 'keycloak'`), and `scripts/configure-keycloak.mjs` is run by the CLI after copying the template. Both templates already include the ui-kit dark theme CSS (`coto.dark-theme()`), activated by the `coto-dark-theme` class that `CotoThemeService` toggles and persists in `localStorage` (default `light`).

## Goals / Non-Goals

**Goals:**
- Two wizard questions with a clear explanation, safe defaults and matching flags.
- The generated project is coherent for each answer (no dead scripts, no broken e2e).

**Non-Goals:**
- A real persistence layer for the JSON mode.
- Following the OS `prefers-color-scheme`.

## Decisions

- **Products data source switch.** `ProductsService` becomes a contract (abstract class) with two implementations: `HttpProductsService` (today's behavior) and `JsonProductsService`, selected by `environment.api.mode: 'http' | 'json'` in `app.config.ts`, the same pattern as the auth mode. Alternative considered: generating different service files from the CLI; rejected because string-editing sources is brittle.
- **JSON mode behavior.** `JsonProductsService` fetches `/mock/products.json` once (served from `public/mock/products.json`) into a signal-backed in-memory list and applies create/update/delete to it, simulating ids. Changes are lost on reload; documented in the README.
- **Single seed file.** The supermarket seed moves to `public/mock/products.json`; `mock/server.mjs` reads it, so both modes share the same data.
- **Declining the mock API is applied by a project script**, `scripts/remove-mock-api.mjs` (also exposed as `npm run remove:mock-api`), run by the CLI like `configure-keycloak`. It sets `api.mode: 'json'` in the environment files, deletes `mock/server.mjs`, removes the `mock:api` script, the dev proxy and the Playwright `webServer` entry for the mock API. The `/api` location in `nginx.conf` stays, because a real backend is expected there.
- **Dark mode flag.** Both templates get `theme.darkMode: boolean` in their environment files (default `false`). The header shows a `ThemeToggle` component only when it is true; `CotoThemeService` handles state and persistence. The dark CSS stays in `styles.scss` (it is inert without the class); `App` creates `CotoThemeService` only when the flag is true. The service applies the stored theme when it is created, so when the flag is false the class is never applied, even if a stale `localStorage` value exists. The CLI sets the flag with a small project script `scripts/configure-theme.mjs` (also `npm run configure:theme`), mirroring the Keycloak one.
- **Wizard UX.** The mock API question is a `confirm` with an explanatory message: it is a small local server for the products example so the ABM works without a backend; if declined, the ABM uses a JSON file and changes are not persisted. The dark mode question is a `confirm` with default `false`. Questions are asked after the Keycloak one (backoffice) and before generation; the summary lists the chosen options.
- **Flags.** `--no-mock-api` (backoffice only; rejected for public) and `--dark-mode`. With `--yes` or no terminal, unspecified answers use the defaults.

## Risks / Trade-offs

- Both implementations live in the template, so a declined project keeps `HttpProductsService` as a ready path to a real backend; this is intentional but is a little unused code.
- The Playwright config edit is a text edit; the script must fail loudly if the expected block is not found, and a CLI test generates a project with `--no-mock-api` and runs its unit tests and e2e through `scripts/verify-templates.mjs`.
- Not creating the service when the flag is false protects users, but a stored `dark` value from another app on the same origin (localhost) is ignored in that case.
