# Proposal

## Why

The templates are Spanish-facing but still expose English URL paths, the home text has a grammar slip and gives no way to reach the ui-kit, the wizard does not make clear that the mock API is only a mock, and the text-only theme toggle looks out of place.

## What Changes

- The application routes become Spanish: `/acerca-de`, `/productos`, `/productos/nuevo`, `/productos/:id/editar`. The API (`/api/products`), folders, files and `data-testid`s stay in English.
- The home description reads "construidas con Coto UI Kit" and links to the ui-kit repository.
- The wizard question about the mock API states that it is only a mock, not a real API; the READMEs say the same.
- The theme toggle becomes an icon button with an animated sun that morphs into a moon (and back), respecting reduced motion.

## Capabilities

### New Capabilities

### Modified Capabilities
- `public-template`: Spanish route for the about page, home link to the ui-kit repository, animated icon toggle.
- `backoffice-template`: Spanish routes, home link to the ui-kit repository, animated icon toggle.
- `cli-wizard`: the mock API question clarifies it is a mock.

## Impact

- Both templates: `app.routes.ts`, header, home and list/form pages, theme toggle component, unit and e2e specs, READMEs and `CLAUDE.md`.
- `cli/src/wizard.js` and its test.
