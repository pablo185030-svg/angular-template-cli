# Proposal

## Why

Projects generated for Coto teams are used by Spanish-speaking people, and the CLI wizard is already in Spanish. The templates still render English text and a generic product sample (olive oil, pasta), so every team has to translate the same strings and replace the sample data by hand.

## What Changes

- All user-visible text rendered by the public and backoffice templates is written in Spanish: navigation, page titles and bodies, footer, not-found page, confirm dialog, form labels, buttons, validation messages, loading/empty/error states, accessible labels, and the demo user and demo badge.
- The `lang` attribute of both `index.html` files becomes `es`, and the app locale is `es-AR` so currency and number formats are Argentine.
- The backoffice products ABM uses supermarket products (milk, bread, yerba mate, rice, ...) as sample data in the mock API, with Spanish labels (Nombre, Precio, Stock).
- Unit and e2e tests assert the Spanish text.
- Out of scope: code, identifiers, comments, `data-testid` values, routes (`/products`, `/about`), documentation and OpenSpec artifacts stay in English.

## Capabilities

### New Capabilities

### Modified Capabilities
- `public-template`: the home, about, not-found, header and footer text is Spanish.
- `backoffice-template`: all UI text is Spanish, the demo user is Spanish, and the CRUD example uses supermarket products.

## Impact

- `templates/public/src` and `templates/backoffice/src`: HTML templates, a few component classes (validation messages, error messages, dialog data), `app.config.ts` (locale), `index.html`.
- `templates/backoffice/mock/server.mjs`: seed data and API error messages.
- Unit specs and `e2e/*.spec.ts` in both templates.
- READMEs/`CLAUDE.md` of the templates only where they quote UI text or sample data.
