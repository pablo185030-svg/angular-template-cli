# Tasks

## 1. Public template

- [x] 1.1 Translate header, footer, home, about and not-found HTML (keep the `coto-angular-template` placeholder token) and set `lang="es"` in `src/index.html`
- [x] 1.2 Update `main-layout`, `footer`, `app.routes` unit specs and `e2e/home.spec.ts` to the Spanish text
- [x] 1.3 Run the affected unit specs individually, then lint and build

## 2. Backoffice template: UI text

- [x] 2.1 Translate header (including demo badge and logout), footer, home, about, not-found and confirm-dialog HTML; set `lang="es"` in `src/index.html`
- [x] 2.2 Translate the demo user name in `MockAuthService`, plus the default confirm label and any error strings in components and services
- [x] 2.3 Register `es-AR` locale data and `LOCALE_ID` in `app.config.ts`; format prices with `currency` for ARS

## 3. Backoffice template: products ABM

- [x] 3.1 Translate the list and form pages (titles, labels, buttons, loading/empty states, aria-labels, dialog title/message) and the validation messages in `product-form-page.ts`
- [x] 3.2 Replace the seed data in `mock/server.mjs` with supermarket products and translate its error messages
- [x] 3.3 Update `products.service.spec.ts`, page specs, header/footer specs, `e2e/home.spec.ts` and `e2e/products.spec.ts` to the Spanish text and new sample data

## 4. Docs and verification

- [x] 4.1 Update template READMEs/`CLAUDE.md` where they quote UI text or sample products (docs stay in English)
- [x] 4.2 Run `npm run typecheck`-equivalent builds per template, then `npm run verify:quick` (or `npm run verify`)
