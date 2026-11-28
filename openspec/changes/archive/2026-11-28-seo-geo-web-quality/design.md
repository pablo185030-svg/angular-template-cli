# Design

## Context

See proposal.md for motivation. Current state of `templates/public`:

- SSR for every route (`RenderMode.Server`), Express in `src/server.ts` serving `dist/.../browser` statically (`maxAge: '1y'`, `index: false`) and delegating the rest to the Angular engine.
- `index.html` has a static `<title>` and no other metadata. Route titles are English (`Home`, `About`) while the UI is Spanish.
- `public/` holds only `favicon.ico` and `coto-logo.svg`; it is copied to the build root, so files added there are served by Express, nginx and any static host.
- The header already uses `NgOptimizedImage` with `priority`; ESLint already runs `templateAccessibility`.
- `scripts/configure-rendering.mjs` rewrites `angular.json`, `package.json`, `Dockerfile`, `nginx.conf` and removes the server files for SSG and SPA. It matches on exact text, so SEO changes must not touch what it matches.
- The CLI copies every non-excluded file, dotfiles included, so a `.claude/` folder in the template reaches generated projects.
- The unknown-path response is the not-found page with HTTP 200 (no response status is set).

## Goals / Non-Goals

**Goals:**
- A page author declares title and description in the route and gets everything else (canonical, social tags, robots) for free.
- Anything mechanically checkable fails a normal command (`npm test`, `npm run lint`, `npm run test:e2e`) when violated.
- Works unchanged in SSR, and degrades correctly in SSG and SPA.

**Non-Goals:**
- Default Open Graph image, i18n/hreflang, analytics, cookie consent.
- Lighthouse CI or any performance budget in the pipeline.
- Vendoring third-party SEO skill packs.
- Real 404 status in SSG/SPA: static hosts serve the shell with 200; documented as a limitation.

## Decisions

**1. Route-driven metadata through a `TitleStrategy`.** Routes keep `title` and gain `data: { seo: { description, noindex? } }`. A custom `TitleStrategy` (provided in `app.config.ts`) builds `"<title> | <site name>"` and calls `SeoService`. Pages stay free of SEO code, the router already runs it on SSR and on every navigation, and a unit test can iterate the route table.
*Alternative:* each page calls the service in its constructor. Rejected: it is easy to forget and cannot be validated centrally.

**2. `SeoService` is the only writer of head tags.** In `core/services/`, using Angular `Title`, `Meta` and the injected `DOCUMENT` (SSR-safe, no globals). It owns description, canonical (a single `<link rel=canonical>`, updated in place), Open Graph, Twitter, robots, and JSON-LD (`<script type="application/ld+json" data-seo>` elements, removed and re-created on each navigation). CLAUDE.md forbids direct `document`/`<meta>` use.

**3. One `siteUrl`, static crawler files kept in sync by a test and a script.** `siteUrl` lives in `environment.ts` and `environment.prod.ts` with a placeholder (`https://www.example.com`). `robots.txt`, `sitemap.xml` and `llms.txt` are plain files in `public/` so every rendering mode and host serves them with no extra code. A unit test checks the sitemap against the route table and that every URL starts with `siteUrl`. `scripts/configure-seo.mjs --site-url` rewrites the environments and the three files. It follows the existing `configure-*.mjs` style and validates input before writing.
*Alternative:* generate sitemap and robots dynamically in Express. Rejected: it would not exist in SSG/SPA, and it adds server code the conversion script would have to remove.
*Also:* the wizard asks for the domain (decision 12), so the script is the fallback, not the only path.

**4. The route table is the sitemap source for the test.** The test reads `routes` from `app.routes.ts`, keeps routes that have a title and are not `noindex` and not `**`, and compares their paths with the `<loc>` entries. Adding a route without updating the sitemap fails the test.

**5. Real 404 under SSR.** `NotFoundPage` optionally injects `RESPONSE_INIT` (only provided on the server) and sets `status: 404`, and its route sets `noindex`. The e2e/SSR check requests an unknown path against the built server. The exact injection token and import path must be verified against Angular 22 during implementation.

**6. Structured data on the home page only.** `HomePage` calls `SeoService.setJsonLd` with a `WebSite` and an `Organization` built from `siteUrl` and the site name. Other pages add their own when relevant. Keeping it in the page, not in route data, lets it use richer content later.

**7. Accessibility guardrails: axe in Playwright.** A new `e2e/a11y.spec.ts` uses `@axe-core/playwright` with tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`, over each route (taken from a list that a unit test compares with the route table) at 320px and 1280px, plus the open drawer at 320px. The skip link goes first in `MainLayout`, targets `<main id="main-content" tabindex="-1">`, and is hidden with a visually-hidden pattern until `:focus`. Colors come from the ui-kit only, so contrast failures from the kit are reported, not worked around in the app.
*Alternative:* `jest-axe` in unit tests. Rejected: contrast and layout rules need a real browser.

**8. Image rule by lint.** Enable `@angular-eslint/template/prefer-ngsrc` as an error in `eslint.config.mjs`. Guidance in CLAUDE.md: always `ngSrc` with `width` and `height`, `priority` only on the LCP image, AVIF/WebP for raster assets, `sizes` for responsive images, `alt` in Spanish or empty for decorative ones.

**9. Server and nginx defaults.** Express sets `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` and `X-Frame-Options: SAMEORIGIN` in a small middleware, and `Cache-Control: no-cache` for HTML (already the default when `maxAge` applies only to static files). The nginx configs add the same headers. `configure-rendering.mjs` regenerates the static nginx config, so its generated text gets the same headers and its tests are updated. Compression stays in nginx. Fonts: Angular's production build already inlines the Google Fonts CSS, which includes `font-display: swap`; a task verifies it on the built HTML and records the result instead of changing fonts blindly.

**10. Agent guidance in two parts.** `CLAUDE.md` gets a short section: checklist per page, "use `SeoService`", "run `web-quality-review` before finishing UI changes", and a pointer to the executable guardrails. `.claude/skills/web-quality-review/SKILL.md` holds the long checklist and the audit procedure: build, inspect the built HTML per route (title, description, canonical, h1, JSON-LD, images), run the axe e2e, check crawler files, and optionally `npx lighthouse` against `serve:ssr` for Performance, Accessibility, Best Practices and SEO. It reports findings as blocker, warning or suggestion, and notes skipped checks. It reads `angular.json` to know the rendering mode.
*Alternative:* adopt a community pack (`claude-seo`, `tvl-seo-geo-audit`). Rejected as a dependency of the template; the README mentions them as optional extras.

**11. GEO stance.** The baseline that is evidence-based: content in the initial HTML (SSR/SSG), semantic structure, JSON-LD, crawlable files, and AI crawlers allowed by `robots.txt`. `llms.txt` is included because it is cheap, but described as optional and unproven. README explains how to block specific AI crawlers.

**12. Never ship the placeholder domain.** Two layers, no runtime behavior. (a) `scripts/check-seo.mjs` exits non-zero when `siteUrl` in `environment.prod.ts`, or any URL in `robots.txt`, `sitemap.xml` or `llms.txt`, is on `example.com`, `example.org` or `example.net`; it names every offending file and the `configure:seo` command. It runs as the npm `prebuild` script, so `npm run build` (and therefore the Docker flow and CI that build for production) fails first. `build:dev`, `start` and tests are untouched. `ALLOW_PLACEHOLDER_SITE_URL=1` skips it, for the template itself and `npm run verify`. (b) The wizard asks for the production domain of a public website (optional; `--site-url`), validates it with the same rules as `configure:seo`, and runs the project's own `scripts/configure-seo.mjs` after the rendering step, so the CLI keeps no copy of the file list. Leaving it empty keeps the placeholder and the summary says the build will fail until `configure:seo` runs.
*Alternative:* a runtime fail-safe (`noindex` everywhere and a startup warning while the placeholder is set). Rejected for now: it changes rendered HTML based on configuration, only works under SSR, and can hide a site from search for a non-obvious reason.
*Alternative:* a failing unit test. Rejected: the template itself must keep `npm test` green with the placeholder.

## Risks / Trade-offs

- [ui-kit components may fail axe rules (e.g. contrast, ARIA)] → Run the scan early; fix what the app owns, and report kit issues rather than suppressing rules. Any exclusion must be listed in the spec file with a reason.
- [Placeholder `siteUrl` ships to production unchanged] → `npm run build` fails while the placeholder is present (decision 12) and the wizard asks for the domain. Residual: someone who sets `ALLOW_PLACEHOLDER_SITE_URL=1` in a pipeline, or builds with `build:dev`/`ng build` directly, still ships it.
- [The guard breaks the template's own builds] → The template and `npm run verify` legitimately use the placeholder, so `verify` sets `ALLOW_PLACEHOLDER_SITE_URL=1`. Nothing else should.
- [`configure-rendering.mjs` matches exact text and could break on new files] → Do not edit what it matches except nginx header text, and run `npm run verify` which builds both conversions.
- [`RESPONSE_INIT` details differ in Angular 22] → Verify first; fall back to a documented limitation only if no supported API exists.
- [Test that reads `public/` files depends on the test environment] → Use `node:fs` from the spec; if the unit-test runner cannot, move the check to a `scripts/` check run in `npm test`.
- [Static hosts return 200 for unknown paths in SSG/SPA] → Documented limitation, `noindex` is still emitted.
- [More files in the template] → They are all functional (no demo content), consistent with "templates must stay simple".

## Migration Plan

Template change only; existing generated projects are unaffected. New projects receive everything. Rollback is a revert of this change.

## Open Questions

- Default site name for titles and JSON-LD: reuse the project name (`coto-angular-template`, replaced by the CLI) so no wizard change is needed. Can be changed later without affecting the specs.
