# Design

## Context

Both templates share the same `shared/layouts/main-layout/components/footer` and `app.ts` structure, and `tsconfig.json` already has `resolveJsonModule`. Environments expose `envName`.

## Goals / Non-Goals

**Goals:**
- Same behavior and code in both templates.

**Non-Goals:**
- Injecting the version at build time or from git; no CI/versioning tooling.

## Decisions

- **`VersionService`** (`providedIn: 'root'`, in `shared/version/`) imports `package.json` (`import packageJson from '../../../../package.json'`) and exposes `getVersion()` and `logBannerVersion()`. Same approach as the reference project `ms-digital-sitio-web-ui`; the JSON is bundled at build time, so no runtime request.
- **Banner** is logged from `App` inside `afterNextRender`, which only runs in the browser, so SSR never logs it. Uses `%c` styles with neutral colors (no palette of its own, see project rules): dark badge for environment/version, no brand red.
- **Footer** injects the service and renders `v{{ version }}` after the copyright text.
- The project name in the banner uses the `coto-angular-template` placeholder so the CLI replaces it.

## Risks / Trade-offs

- [Version stays `0.0.0` until the generated project bumps it] → expected; it is the project's own `package.json`.
