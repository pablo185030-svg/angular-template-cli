## Why

Both templates lay the header out as a single row of links that does not fit on phones, and nothing else in the layout is verified for small screens. Generated projects should be usable on mobile from the first commit.

## What Changes

- Both templates (`public`, `backoffice`) become responsive, mobile-first.
- Below the tablet-portrait breakpoint (768px) the header shows an animated hamburger button instead of the inline navigation. The button morphs into a close icon when the drawer is open.
- The button opens a drawer that slides in from the side over a dimmed backdrop. It contains the navigation links and, in the backoffice, the user area (theme toggle, demo badge, user name, logout). In the public template it also contains the theme toggle when dark mode is enabled.
- The drawer closes on backdrop click, Escape, link activation or when the viewport grows to the desktop layout. It traps focus while open and returns focus to the button.
- From the tablet-portrait breakpoint up, the header keeps its current inline layout.
- Animations are disabled for users who prefer reduced motion.
- Page content must not overflow horizontally on a 320px viewport. In the backoffice the products table turns into a list of cards below 768px.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `public-template`: the main layout requirement gains responsive behavior and a header drawer.
- `backoffice-template`: the folder scaffolding and layout requirement gains the same responsive behavior, with the user area inside the drawer on small screens.

## Impact

- `templates/public` and `templates/backoffice`: header component (ts, html, scss, spec), a new hamburger icon component, main layout and page styles, e2e specs, README and `CLAUDE.md`.
- No new dependencies: the drawer uses Angular CDK (already installed) for focus trapping and plain CSS transitions.
- CLI and `configure-*` scripts are unaffected.
