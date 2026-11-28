# coto-angular-template (public website)

Public website template: Angular 22, server-side rendered, zoneless, styled with `@coto-dev/ui-kit`.

## Commands

```bash
npm install            # needs access to the private registry (see .npmrc)
npm start              # dev server on http://localhost:4200
npm run build          # production build (browser + SSR server) in dist/; fails while siteUrl is example.com
npm run serve:ssr      # run the built SSR server (PORT, default 4000)
npm test               # unit tests (Vitest via @angular/build:unit-test)
npm run test:e2e       # Playwright e2e (starts the dev server itself)
npm run lint           # ESLint
npm run configure:seo -- --site-url https://www.your-domain.com   # sets siteUrl everywhere
npm run format         # Prettier
```

Run a single unit spec with `npx ng test --watch=false --include "src/app/**/header.spec.ts"`.

## Stack and rules

- `@coto-dev/ui-kit` is installed from the private Nexus registry. `.npmrc` scopes `@coto-dev` to it, so the registry must be reachable from your network. Check `node_modules/@coto-dev/ui-kit/types/*.d.ts` before using a library component.
- All `@angular/*` packages are pinned to the same exact version (no `^`) and are upgraded together.
- Standalone components, `OnPush`, `inject()`, signals, `@if`/`@for` control flow. No NgModules, no Zone.js.
- Forms use Signal Forms (`@angular/forms/signals`).
- Styling: SCSS with BEM, `rem` for layout, mobile-first (`coto.breakpoint-up(...)`), colors only from `var(--mat-sys-*)`. Never define a color palette in this app.
- Files and folders are kebab-case. Types live in `models/` folders, not in component or service files.
- Unit tests next to the code (`*.spec.ts`). Select elements with `data-testid`, not CSS classes.
- All code, comments and docs are written in English; user-visible UI text is in Spanish.
- If the official Angular skill (`.claude/skills/angular-developer`) is installed, the rules in this file take precedence over it wherever they differ (Signal Forms, BEM, ui-kit colors, `data-testid`, file layout).

## Structure

```
src/app/
  core/       app-wide singletons: guards/ interceptors/ services/ models/ (services/seo.service.ts, services/page-title.strategy.ts)
  shared/     layouts/main-layout (header with hamburger drawer + routed page + footer), components/, pages/not-found-page
  domains/    one folder per feature area: home/, about/ (pages/<name>-page/)
  app.routes.ts          main layout with child routes '', 'acerca-de' and a not-found '**'
  app.routes.server.ts   SSR render mode per route
src/environments/        environment.ts (dev) and environment.prod.ts (SSR allowed hosts); both hold `theme.darkMode`, `siteUrl` and `siteName`
public/                  robots.txt, sitemap.xml, llms.txt (crawler files), favicon and logo
scripts/configure-seo.mjs  sets `siteUrl` in the environments and the crawler files (`npm run configure:seo`)
scripts/check-seo.mjs      `prebuild` guard: fails the production build while the placeholder domain remains
scripts/configure-theme.mjs  turns dark mode support on or off (`npm run configure:theme`)
scripts/configure-rendering.mjs  converts the SSR project to SSG or SPA (`npm run configure:rendering -- --mode ssg|spa`); one-way, SSR only
e2e/                     Playwright specs (a11y.spec.ts: axe WCAG 2.2 AA; seo.spec.ts: metadata, 404, headers, crawler files)
.claude/skills/web-quality-review/  on-demand audit of everything in the next section
```

Add a feature by creating `domains/<name>/pages/<name>-page/` and a lazy route in `app.routes.ts`. Routes (URL paths) are in Spanish (`/acerca-de`); folders, files and `data-testid`s stay in English.

`theme.darkMode` (default `false`): when true the header shows `ThemeToggle` and `App` creates the ui-kit `CotoThemeService` (starts light, persists the choice); when false the app is always light.

The header shows the navigation inline from 768px (`tablet-portrait`) and a hamburger `MenuToggle` plus a drawer below it (CSS decides which; `Header` only keeps the `menuOpen` signal and resets it when the viewport grows). Nav links are defined once in the `links` template of `header.html` and rendered in both places; the drawer copy has a `drawer-` `data-testid` prefix. Keep new pages free of horizontal overflow at 320px.

## SEO, GEO and web quality

These rules always apply. Most of them are enforced by `npm test`, `npm run lint` and `npm run test:e2e`; a failing check means the rule was broken, so fix the code instead of the check.

- `SeoService` (`core/services/seo.service.ts`) is the only writer of the title, description, canonical link, Open Graph/Twitter tags, robots and JSON-LD. Never touch `document.title`, `<meta>`, `<link rel="canonical">` or add `<script type="application/ld+json">` by hand. `PageTitleStrategy` feeds the service from the route.
- Never hardcode the domain. URLs come from `environment.siteUrl` (`SeoService.absoluteUrl(path)`); change it with `npm run configure:seo -- --site-url ...`. The shipped `https://www.example.com` is a placeholder: `npm run build` runs `scripts/check-seo.mjs` first and fails while it (or `example.org`/`example.net`) is in `environment.prod.ts` or a crawler file. Never set `ALLOW_PLACEHOLDER_SITE_URL=1` to get past it for a real deploy; set the domain.
- Every new page needs, in this order:
  1. A lazy route in `app.routes.ts` with a Spanish `title` and `data: { seo: { description: '...' } satisfies RouteSeoData }` (a unique description of about 70-160 characters). Use `noindex: true` only for pages that must stay out of search. `app.routes.spec.ts` fails without them.
  2. An entry in `public/sitemap.xml` and, for main pages, a link in `public/llms.txt` (`crawler-files.spec.ts` fails if the sitemap and the routes differ). Never add a `noindex` page to the sitemap.
  3. Exactly one `h1`, headings that do not skip levels, and content inside the layout's `main` landmark. Use native elements (`button`, `a`, `nav`, `section` with a heading, `ul`) before ARIA.
  4. Page-specific structured data (`Article`, `Product`, `FAQPage`, `BreadcrumbList`...) with `SeoService.setJsonLd(id, data)`, built from `siteUrl`. The home page already emits `WebSite` and `Organization`.
- The main content of a page must be in the HTML the server sends: do not render it only after `afterNextRender` or behind `isPlatformBrowser`, and do not hide it behind JS-only interactions. Search engines and AI answer engines read that HTML.
- Images use `NgOptimizedImage` (`ngSrc`) with explicit `width` and `height` (lint enforces `ngSrc`). `priority` only on the single image that is the largest contentful element above the fold; all others stay lazy. Prefer AVIF/WebP for raster files, add `sizes` to responsive images, and give every image a Spanish `alt` (empty `alt=""` when decorative).
- Accessibility target is WCAG 2.2 AA (`e2e/a11y.spec.ts` scans every sitemap page at 320px and 1280px and the open drawer). Every interactive element is keyboard operable, has a visible focus state and a Spanish accessible name; never remove focus outlines; respect `prefers-reduced-motion`; keep touch targets at least 24x24px. Colors and contrast come from the ui-kit tokens only: report a ui-kit contrast problem instead of working around it.
- Core Web Vitals: keep lazy routes, no render-blocking scripts or large third-party scripts, reserve space for anything that loads late (no layout shift), and keep event handlers light.
- `robots.txt` allows all crawlers, AI crawlers included. Blocking one is the site owner's decision: change it only when asked.
- HTTP 404 for unknown paths and the security headers are set by the Node server (`src/server.ts`) and `nginx.conf`; SSG and SPA hosts cannot set the status. Keep both nginx configs and the script that generates the static one in sync.
- Before finishing any UI or content change run `npm test`, `npm run lint`, `npx playwright test a11y seo`, and review the result with the `web-quality-review` skill (`.claude/skills/web-quality-review`).

## SSR

The template ships as SSR; `scripts/configure-rendering.mjs` (run by the wizard, or by hand) converts a copy to SSG or SPA and rewrites `Dockerfile` and `nginx.conf` for static hosting. Keep the template itself SSR and keep the script's expectations (`outputMode: "server"`, `ssr.entry`, the server files) in sync with `angular.json` and the source files; `cli/test/configure-rendering.test.js` runs the script on the real template files and `npm run verify` builds both conversions.

`src/server.ts` is the Express entry point. `@angular/ssr` rejects unknown hosts: add the public hostname to `ssr.allowedHosts` in `src/environments/environment.prod.ts`. `README.md` has the user-facing docs in Spanish (default) and `README.en.md` is the English copy (keep both in sync with this file). `Dockerfile` runs the built server; `nginx.conf` is an optional reverse proxy that serves static assets and forwards the rest to Node.
