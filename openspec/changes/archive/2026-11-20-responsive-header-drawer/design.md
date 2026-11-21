# Design

## Context

Each template has a `Header` component (grid: brand, nav, and in the backoffice a user area) with no small-screen behavior. The theme toggle already uses a hand-made animated SVG with CSS transitions and a reduced-motion override; the styling rules require SCSS with BEM, `rem`, mobile-first `coto.breakpoint-up(...)` and colors only from `var(--mat-sys-*)`. `@angular/cdk` is already a dependency. The app is zoneless, OnPush and SSR. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- One header per template that switches between inline and drawer navigation with CSS, so SSR output is correct without JavaScript measuring the viewport.
- Accessible drawer (focus trap, Escape, `aria-expanded`, restored focus).
- No new dependency, no `@angular/animations`.

**Non-Goals:**
- A reusable drawer or sidenav library component; swipe gestures; nested menus; a responsive redesign of page content beyond preventing horizontal overflow.

## Decisions

1. **Custom drawer instead of `MatSidenav`.** `MatSidenav` needs a container wrapping the whole layout and animation providers, and pushes layout concerns into `main-layout`. A small drawer inside the header (fixed-position panel + backdrop, CSS `transform` transition) keeps the change local. Alternative: `MatSidenav` (heavier, changes layout structure).
2. **Breakpoint by CSS, state by a signal.** The inline nav and the hamburger are both rendered; `coto.breakpoint-up(tablet-portrait)` shows one or the other. The drawer is an `open` signal toggled by the button. When the viewport reaches the desktop width the drawer is hidden by CSS, and a `matchMedia('(min-width: 768px)')` listener (browser only, guarded by `isPlatformBrowser`) resets `open` so focus trap and scroll lock do not linger. Alternative: `BreakpointObserver` from CDK, equivalent but the raw `matchMedia` avoids the extra import; the 768px value mirrors the ui-kit's `tablet-portrait`.
3. **Drawer content is the same links, rendered once.** The navigation links live in an `ng-template` rendered both in the inline nav and the drawer to avoid duplicated markup; `data-testid`s get a `drawer-` prefix inside the drawer so tests can target either.
4. **Focus handling with CDK `A11yModule`** (`cdkTrapFocus`, `cdkTrapFocusAutoCapture`) and restoring focus to the button on close; scroll lock via a `body` class set while open.
5. **Hamburger icon** is its own small component (`menu-toggle`) following the theme-toggle pattern: three SVG lines that become an X through CSS transitions on a `--open` modifier, disabled under `prefers-reduced-motion`.
6. **Overflow:** layout columns use `minmax(0, 1fr)` and long words wrap; the products header wraps on narrow viewports.
7. **Products table as cards on mobile.** Scrolling a four-column table sideways is poor on phones, so below 768px the same `mat-table` markup is restyled with CSS as cards (name as title, labelled price and stock via `data-label`, actions at the bottom) and restored to a table from 768px. Angular Material renders the `thead`/`tbody` itself, so those two selectors use `::ng-deep` scoped to the table's BEM class. Alternative: a separate card list in the template (duplicated markup and tests).

## Risks / Trade-offs

- [Duplicate DOM for nav (inline + drawer)] → hidden one is `display: none`, so it is not focusable or read by assistive tech; tests assert on both.
- [Drawer open during SSR/hydration] → state starts closed and only changes on user action, so hydration is stable.
- [Hard-coded 768px in TS] → document it next to the SCSS breakpoint and cover with a unit test of the reset behavior.
