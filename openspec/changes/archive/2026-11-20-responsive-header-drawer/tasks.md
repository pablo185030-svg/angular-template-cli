# Tasks

## 1. Public template

- [x] 1.1 Add a `menu-toggle` hamburger-to-close icon button component (animated, reduced-motion aware, Spanish accessible name, `aria-expanded`) with a unit spec; verify with `npx ng test --watch=false --include "src/app/**/menu-toggle.spec.ts"`
- [x] 1.2 Rework `Header` (ts, html, scss): inline nav from 768px up; below, hamburger plus a drawer with backdrop, focus trap, Escape/backdrop/link/close handling, reset on viewport growth, theme toggle inside when dark mode is on; extend `header.spec.ts` for open, close and desktop behaviors and verify with the single header spec
- [x] 1.3 Make main layout, home, about and not-found styles overflow-safe at 320px; verify with the e2e spec below
- [x] 1.4 Add a Playwright e2e at mobile and desktop viewports (drawer opens, navigates, closes; no horizontal scroll) and verify with `npx playwright test e2e/<spec>` in the template
- [x] 1.5 Update the template `README.md` and `CLAUDE.md` (responsive and drawer conventions) and verify they match the code

## 2. Backoffice template

- [x] 2.1 Add the same `menu-toggle` component and spec; verify with its single spec
- [x] 2.2 Rework `Header` so the user area (theme toggle, demo badge, user name, logout) lives inside the drawer on small screens and inline from 768px; extend `header.spec.ts` (including logout from the drawer) and verify with the single header spec
- [x] 2.3 Make the products list (table rendered as cards below 768px, wrapping header) and product form, home, about and layout styles overflow-safe at 320px; verify with the e2e spec below
- [x] 2.4 Add Playwright e2e at mobile and desktop viewports (drawer with user area, logout, products table scroll contained) and verify with the single e2e spec
- [x] 2.5 Update the template `README.md` and `CLAUDE.md` and verify they match the code

## 3. Integration

- [x] 3.1 Run `npm run verify:quick` and then `npm run verify` at the repository root and verify both pass
- [x] 3.2 Typecheck both templates (`npx tsc --noEmit -p tsconfig.app.json`) and lint, and verify no errors

## Workflow follow-up

- Sync specs and archive the change with `/openspec-archive-change` after review.
