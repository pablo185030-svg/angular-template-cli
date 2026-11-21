## Context

Routes are plain strings in `app.routes.ts`, `routerLink`s and tests. The theme toggle is a Material button created in the previous change.

## Decisions

- **Only app routes change.** `/api/products` is the backend contract, so it stays English; Spanish paths apply to what the user sees in the address bar.
- **Inline SVG, no icon font.** The toggle is a `mat-icon-button` with one SVG: a disc, a mask whose cutout circle slides over it to form a crescent, and a group of rays that rotate, shrink and fade. Transitions are CSS (`r`, `cx`, `cy`, `transform`, `opacity`) driven by a `theme-toggle--dark` class; `prefers-reduced-motion` disables them. The accessible name changes with the state (`Cambiar a modo oscuro` / `Cambiar a modo claro`).
- **Ui-kit link** opens in a new tab with `rel="noopener noreferrer"` and points to the repository's `develop` branch on Bitbucket.

## Risks / Trade-offs

- Spanish paths break old bookmarks of generated projects; acceptable for templates.
- CSS-animated SVG geometry properties (`r`, `cx`, `cy`) are supported by current evergreen browsers; older ones simply switch without animation.
