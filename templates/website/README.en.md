## coto-angular-template

![Angular](https://img.shields.io/badge/Angular-22.1-DD0031?style=flat&logo=angular) ![Angular Material](https://img.shields.io/badge/Material-22.1-DD0031?style=flat&logo=angular) ![Material Design 3](https://img.shields.io/badge/Material_Design-3-757780?style=flat&logo=materialdesign) ![SSR](https://img.shields.io/badge/SSR-@angular/ssr-DD0031?style=flat&logo=angular) ![Zoneless](https://img.shields.io/badge/Zoneless-enabled-DD0031?style=flat&logo=angular)

![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat&logo=typescript) ![Node](https://img.shields.io/badge/Node-24-339933?style=flat&logo=node.js) ![npm](https://img.shields.io/badge/npm-package_manager-CB3837?style=flat&logo=npm)

![Vitest](https://img.shields.io/badge/Vitest-4.0-6E9F18?style=flat&logo=vitest) ![Playwright](https://img.shields.io/badge/Playwright-1.61-2EAD33?style=flat&logo=playwright) ![ESLint](https://img.shields.io/badge/ESLint-enabled-4B32C3?style=flat&logo=eslint) ![Prettier](https://img.shields.io/badge/Prettier-enabled-F7B93E?style=flat&logo=prettier)

> 🌐 [Español](README.md) · **English**

## Table of Contents

- [What is it?](#what-is-it)
- [Quick start](#quick-start)
- [Stack](#stack)
- [Requirements](#requirements)
- [Installation](#installation)
- [Dependencies](#dependencies)
- [Troubleshooting](#troubleshooting)
- [Main commands](#main-commands)
- [Environments](#environments)
- [Server-side rendering](#server-side-rendering)
- [SEO, GEO and web quality](#seo-geo-and-web-quality)
- [Project structure](#project-structure)
- [Path aliases](#path-aliases)
- [Breakpoints](#breakpoints)
- [Unit tests](#unit-tests)
- [E2E tests with Playwright](#e2e-tests-with-playwright)
- [Deploy](#deploy)

---

<a id="what-is-it"></a>

## What is it?

A public website starter: an Angular 22 app (standalone components, signals, zoneless, SSR) with a main layout (header and footer), a home page, an about page and a not-found page. It is meant to be copied, renamed and grown into a real site.

Theming and shared UI (M3 palette, typography, breakpoints, components) come from `@coto-dev/ui-kit`, an internal design-system library installed from the private Nexus registry — see [Dependencies](#dependencies).

---

<a id="quick-start"></a>

## Quick start

```bash
nvm use            # Node 24
npm install
npm start          # app on http://localhost:4200
```

---

<a id="stack"></a>

## Stack

| Layer           | Technology                                         |
| --------------- | -------------------------------------------------- |
| Framework       | Angular 22 (standalone, signals, zoneless, OnPush) |
| UI / Theming    | Angular Material 22 + `@coto-dev/ui-kit` (M3)      |
| Styles          | SCSS, BEM, mobile-first, CSS custom properties     |
| SSR             | `@angular/ssr` + Express                           |
| Unit tests      | Vitest (via `@angular/build:unit-test`)            |
| E2E tests       | Playwright                                         |
| Package manager | npm                                                |
| Node            | 24 (see `.nvmrc`)                                  |

---

<a id="requirements"></a>

## Requirements

- Node 24 (see `.nvmrc`; recommended: use `nvm` → `nvm use`).
- npm — ships bundled with Node.
- Network access to the private Nexus registry that serves `@coto-dev/ui-kit`.

---

<a id="installation"></a>

## Installation

```bash
nvm use
npm install
```

`prepare` installs the Husky pre-commit hook, which runs `lint-staged` (ESLint + Prettier on staged files). It needs the project to be a git repository.

---

<a id="dependencies"></a>

## Dependencies

The project commits a single lockfile, `package-lock.json`, so install with `npm ci` in CI.

### Why every Angular package is pinned to the same exact version

Every `@angular/*` entry in `package.json` is pinned to the same exact version (no `^`). Angular's packages declare exact peer dependencies on each other, so they must move together; a mix of pinned and ranged entries fails with `ERESOLVE` the next time the tree is resolved after Angular publishes a patch. To upgrade, change the version on every `@angular/*` entry at once and run `npm install`. Don't use an `overrides` block for them.

### `@coto-dev/ui-kit`: installed from the private Nexus registry

- `.npmrc` scopes `@coto-dev` to the private registry, so the registry must be reachable from your network when you run `npm install`. It contains no credentials.
- To bump the library, edit its range in `package.json` and run `npm install`. Don't consume it as a git dependency or a local tarball.
- Before using one of its components, check its API in `node_modules/@coto-dev/ui-kit/types/*.d.ts`.
- The app never defines its own color palette: `src/styles.scss` calls `coto.theme()` once and everything reads `var(--mat-sys-*)`.

---

<a id="troubleshooting"></a>

## Troubleshooting

| Symptom                                         | Likely cause and fix                                                                                           |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `npm install` cannot resolve `@coto-dev/ui-kit` | The Nexus registry is unreachable (VPN / corporate network). Check `.npmrc` and your connection.               |
| `ERESOLVE` after changing Angular versions      | Some `@angular/*` entry has a different version or a `^`. Pin them all to the same exact version.              |
| `NG0203` / injection errors in unit tests       | A second copy of `@angular/*` was resolved. `vitest.config.ts` already dedupes them; reinstall `node_modules`. |
| SSR responds with a host error                  | Add the hostname to `ssr.allowedHosts` — see [Server-side rendering](#server-side-rendering).                  |

---

<a id="main-commands"></a>

## Main commands

| Command                       | Description                                                                                                                        |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `npm start`                   | Dev server at `http://localhost:4200` with hot reload                                                                              |
| `npm run build`               | Production build (browser + SSR server) to `dist/`                                                                                 |
| `npm run build:dev`           | Development build                                                                                                                  |
| `npm run watch`               | Incremental build in development mode                                                                                              |
| `npm run serve:ssr`           | Runs the built SSR server (`PORT`, default 4000); requires a prior `npm run build`                                                 |
| `npm test`                    | Unit tests with Vitest (watch mode)                                                                                                |
| `npm run lint`                | ESLint (`angular-eslint`) on `.ts` and `.html` under `src/`                                                                        |
| `npm run format`              | Prettier on `src/` and `e2e/`                                                                                                      |
| `npm run test:e2e`            | Playwright e2e; starts the dev server automatically                                                                                |
| `npm run configure:rendering` | `-- --mode ssg` or `-- --mode spa`: converts the SSR project (see [Rendering mode](#rendering-mode))                               |
| `npm run configure:seo`       | `-- --site-url https://your-domain.com`: sets the public URL in the environments and in `robots.txt`, `sitemap.xml` and `llms.txt` |
| `npm run configure:theme`     | `-- --dark-mode` or `-- --no-dark-mode`: turns the light/dark toggle on or off                                                     |

Run one unit spec: `npx ng test --watch=false --include "src/app/**/header.spec.ts"`.

---

<a id="environments"></a>

## Environments

`src/environments/environment.ts` is used by `npm start`; `environment.prod.ts` replaces it in the production build (`fileReplacements` in `angular.json`). Add a new file and a build configuration if you need another environment.

`theme.darkMode` (default `false`) is the dark mode setting: when `false` the site is always light and shows no toggle; when `true` (or after `npm run configure:theme -- --dark-mode`) the header shows a light/dark toggle, the site starts in light mode and the ui-kit's `CotoThemeService` remembers the choice. The dark styles are always included (`coto.dark-theme()` in `src/styles.scss`) and only apply with the `coto-dark-theme` class.

---

<a id="server-side-rendering"></a>

## Server-side rendering

`src/server.ts` is the Express entry point; `src/app/app.routes.server.ts` sets the render mode per route (everything is server-rendered by default).

`@angular/ssr` rejects every `Host` header by default, to prevent host-header injection. **Add your public hostname(s) to `ssr.allowedHosts`** in `src/environments/environment.prod.ts` before deploying. `/health` answers `200 ok` without rendering, for liveness probes.

---

<a id="seo-geo-and-web-quality"></a>

## SEO, GEO and web quality

The template is ready for search engines and AI answer engines (GEO), and follows Google's recommendations for accessibility, images and performance.

- **Site URL**: `siteUrl` in `src/environments/environment*.ts` (placeholder `https://www.example.com`). Change it with `npm run configure:seo -- --site-url https://www.your-domain.com`: it updates the environments, `robots.txt`, `sitemap.xml` and `llms.txt`. If you generated the project with the wizard and gave the domain (`--site-url`), it is already done.
- **Placeholder domain blocked**: `npm run build` first runs `scripts/check-seo.mjs`, which fails while `environment.prod.ts`, `robots.txt`, `sitemap.xml` or `llms.txt` still use `example.com`, `example.org` or `example.net`, and lists the files to fix. `npm start`, `npm test` and `npm run build:dev` are not affected. Only for tests or pipelines that do not publish, `ALLOW_PLACEHOLDER_SITE_URL=1` skips the check.
- **Per-route metadata**: every route declares `title` and `data: { seo: { description } }` in `app.routes.ts`. `PageTitleStrategy` and `SeoService` write the title (`<page> | <siteName>`), description, canonical, Open Graph, Twitter and `robots` tags, both in the server HTML and on navigation. A route with `noindex: true` emits no canonical and stays out of the sitemap.
- **Crawler files** (`public/`): `robots.txt` allows every crawler, AI crawlers included; to block one, add a block (`User-agent: GPTBot` + `Disallow: /`). `sitemap.xml` lists the indexable routes and a test fails when one is missing. `llms.txt` summarizes the site for language models; it is optional and its effect on search engines is unproven.
- **Structured data**: the home page emits `WebSite` and `Organization` JSON-LD. Any page can add its own with `SeoService.setJsonLd(id, data)`.
- **Real 404**: with SSR an unknown path answers HTTP 404 with the not-found page and `noindex`. On SSG and SPA the host answers 200 (a limitation of static hosts); `noindex` stays.
- **Accessibility**: a "Skip to content" link, a single `h1` per page and an axe E2E test (WCAG 2.2 AA) that scans every sitemap page at 320px and 1280px and the open drawer.
- **Images**: use `NgOptimizedImage` (`ngSrc`) with `width` and `height`; lint fails on a plain `<img src>`. `priority` only on the largest image visible without scrolling (LCP); the rest loads lazily. Prefer AVIF/WebP and always a Spanish `alt` (empty when decorative).
- **Performance and security**: hashed assets cached for a year, HTML not cached, and the `X-Content-Type-Options`, `Referrer-Policy` and `X-Frame-Options` headers on the Node server and in nginx.

To add a page that meets all of this: a route with `title` and `description`, an entry in `sitemap.xml`, a single `h1`, images with `ngSrc` and, when relevant, JSON-LD. Tests and lint tell you when something is missing. The `.agents/skills/web-quality-review` folder holds an AI agent skill that audits all of it on demand (Lighthouse optional); community skills such as [claude-seo](https://github.com/AgriciDaniel/claude-seo) or [tvl-seo-geo-audit](https://academy.tvl.tech/en/skills/tvl-seo-geo-audit/) are optional extras and are not included in the template.

---

<a id="project-structure"></a>

## Project structure

```
src/app/
  core/         app-wide singletons: guards/ interceptors/ services/ models/
  shared/       reusable across domains
    layouts/main-layout/   header + routed page + footer
    pages/not-found-page/
  domains/      one folder per feature area
    home/pages/home-page/
    about/pages/about-page/
  app.routes.ts          main layout with child routes '', 'acerca-de' and a not-found '**'
  app.routes.server.ts   SSR render mode per route
src/environments/        environment.ts, environment.prod.ts (SSR hosts, theme.darkMode)
src/server.ts            Express SSR server
public/                  robots.txt, sitemap.xml, llms.txt, favicon and logo
src/app/core/services/   SeoService and PageTitleStrategy (per-route SEO metadata)
e2e/                     Playwright specs
```

To add a feature, create `domains/<name>/pages/<name>-page/` and a lazy route in `app.routes.ts`. Files and folders are kebab-case; types live in `models/` folders.

### AI agents

This project works with any AI coding agent (Claude Code, Codex, Cursor, GitHub Copilot, Gemini CLI and others), not only Claude:

- `AGENTS.md` holds the project instructions (commands, conventions and rules). Most agents read it; edit this one.
- `CLAUDE.md` only contains `@AGENTS.md`, so Claude Code reads the same instructions.
- `.agents/skills/` holds the project skills (`web-quality-review` and, if you chose it when generating, `angular-developer`). `.claude/skills/` are links to that folder for Claude Code.

If your agent does not support skills, `AGENTS.md` tells it to read `.agents/skills/web-quality-review/SKILL.md` as a plain audit guide.


---

<a id="path-aliases"></a>

## Path aliases

`tsconfig.json` defines path aliases so imports don't depend on long relative paths:

| Alias        | Path                 | Example                                                                 |
| ------------ | -------------------- | ----------------------------------------------------------------------- |
| `@app/*`     | `src/app/*`          | `import { routes } from '@app/app.routes';`                             |
| `@core/*`    | `src/app/core/*`     | `import { authGuard } from '@core/guards/auth.guard';`                  |
| `@shared/*`  | `src/app/shared/*`   | `import { MainLayout } from '@shared/layouts/main-layout/main-layout';` |
| `@domains/*` | `src/app/domains/*`  | `import { HomePage } from '@domains/home/pages/home-page/home-page';`   |
| `@env/*`     | `src/environments/*` | `import { environment } from '@env/environment';`                       |

They work in the dev server, the build and the unit tests with no extra configuration.

---

<a id="breakpoints"></a>

## Breakpoints

Breakpoints come from `@coto-dev/ui-kit`, so SCSS and TypeScript share the same thresholds. The design system is **mobile-first**: write base styles for the smallest screen and layer overrides upward.

**Responsive header.** From `tablet-portrait` (768px) up the header shows the navigation inline. Below it, a hamburger button (`menu-toggle`) opens an animated drawer with the same links (and the theme toggle when dark mode is on). The drawer closes on backdrop click, Escape or link activation, traps the focus while open, and respects `prefers-reduced-motion`. To add a link, edit the shared `links` template in `header.html`: it feeds both the inline navigation and the drawer.

| Breakpoint name    | Min width |
| ------------------ | --------- |
| `mobile`           | 320px     |
| `tablet-portrait`  | 768px     |
| `tablet-landscape` | 1024px    |
| `desktop-small`    | 1366px    |
| `desktop-large`    | 1920px    |

```scss
@use '@coto-dev/ui-kit/styles' as coto;

.card {
  padding: 1rem; // mobile (base, no query)

  @include coto.breakpoint-up(tablet-landscape) {
    padding: 2rem;
  }
}
```

From TypeScript use the `COTO_BREAKPOINTS` constant (e.g. with `BreakpointObserver`).

---

<a id="unit-tests"></a>

## Unit tests

Vitest through Angular's `@angular/build:unit-test` builder. Specs live next to the code as `*.spec.ts` and need no registration. Select elements with `data-testid`, not CSS classes. Run everything with `npm test`, or one spec with `--include` (see [Main commands](#main-commands)).

---

<a id="e2e-tests-with-playwright"></a>

## E2E tests with Playwright

```bash
npx playwright install chromium   # first time only
npm run test:e2e
```

Playwright starts the dev server itself (`playwright.config.ts`). Prefer accessible locators (`getByRole`, `getByLabel`), then `getByTestId`. The example in `e2e/home.spec.ts` visits the home page, navigates to about and checks the layout.

---

<a id="deploy"></a>

## Deploy

- (SSR) `Dockerfile` runs the built SSR server (`npm run build` first): `docker build -t coto-angular-template . && docker run -p 4000:4000 coto-angular-template`.
- `nginx.conf` is an optional reverse proxy that serves the static assets from disk and forwards everything else to the Node server. It is a complete `server{}` block, to be placed at `/etc/nginx/conf.d/default.conf`.
