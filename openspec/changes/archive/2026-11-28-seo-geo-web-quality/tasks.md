# Tasks

All paths are relative to `templates/public/` unless stated. Install with `HUSKY=0 npm install`. Run single tests while iterating.

## 1. Site URL and SEO service

- [x] 1.1 Add `siteUrl` (placeholder `https://www.example.com`) to `src/environments/environment.ts` and `environment.prod.ts`; verify `npm run build` still succeeds.
- [x] 1.2 Create `SeoService` in `src/app/core/services/` (title, description, canonical, Open Graph, Twitter, robots, JSON-LD set/clear, no `og:image` unless provided) with `seo.service.spec.ts`; verify the spec passes (`npx ng test --watch=false --include "src/app/core/**/seo.service.spec.ts"`) covering a single canonical, replaced JSON-LD and `noindex`.
- [x] 1.3 Add a `TitleStrategy` that builds `"<title> | <site name>"` and feeds `SeoService` from route `data.seo`, provided in `app.config.ts`, with a spec; verify navigation between two routes changes title, description and canonical.
- [x] 1.4 Give the home, about and not-found routes Spanish titles and descriptions (not-found with `noindex`) and update `app.routes.spec.ts` to fail when a route lacks a title or description; verify with that spec.
- [x] 1.5 Keep the static `<title>` in `src/index.html` as a neutral default (the site name) and do not add `theme-color`, which needs a hardcoded color the template must not define; verify the built home HTML contains the home title, description and canonical.

## 2. Structured data and real 404

- [x] 2.1 Emit `WebSite` and `Organization` JSON-LD from `HomePage` using `siteUrl`, with a spec; verify the SSR response of `/` contains exactly one `application/ld+json` script.
- [x] 2.2 Check how Angular 22 exposes the SSR response status (`RESPONSE_INIT`) and set 404 from `NotFoundPage` when available; verify with `npm run build` then `npm run serve:ssr` that an unknown path returns 404 with the not-found body and `/` returns 200. Record the chosen API in `design.md` if it differs.
- [x] 2.3 Add an e2e or script-level check for the 404 status against the built server; verify it passes in `npm run test:e2e` (or document why it runs only against the build).

## 3. Crawler files and configure:seo

- [x] 3.1 Add `public/robots.txt` (allow all, sitemap line, commented list of AI crawler user agents), `public/sitemap.xml` and `public/llms.txt` using the placeholder `siteUrl`; verify they appear in `dist/*/browser/` after `npm run build`.
- [x] 3.2 Add a spec that compares sitemap `<loc>` entries with the indexable routes and checks that every crawler-file URL starts with `siteUrl`; verify it fails when a route is added without a sitemap entry and passes afterwards.
- [x] 3.3 Create `scripts/configure-seo.mjs` (`--site-url`, validates an absolute http(s) URL, rewrites environments and the three files, exits non-zero without changes on bad input) and the `configure:seo` npm script; add `cli/test/configure-seo.test.js` running it on the real template files and verify with `node --test cli/test/configure-seo.test.js`.
- [x] 3.4 Run `configure:rendering` in `ssg` and `spa` mode on a copy; verify the crawler files and per-route metadata survive, extend `cli/test/configure-rendering.test.js` where needed, and fix the script only if its text matching breaks.

## 4. Accessibility and layout

- [x] 4.1 Add the Spanish skip link to `MainLayout` (visually hidden until focused) and `id="main-content" tabindex="-1"` on `main`, with a unit spec and a `data-testid`; verify the spec and that the first Tab stop in the browser is the skip link.
- [x] 4.2 Add `@axe-core/playwright` as a devDependency and create `e2e/a11y.spec.ts` scanning every route at 320px and 1280px plus the open drawer at 320px with WCAG 2.0, 2.1 and 2.2 A/AA tags; verify `npx playwright test a11y` passes on the shipped pages.
- [x] 4.3 Fix accessibility violations that belong to the app (headings, names, landmarks); record any ui-kit violation with a reason instead of suppressing it, and verify the a11y spec stays green.
- [x] 4.4 Add a unit check that every page renders exactly one `h1`; verify it passes for home, about and not-found.

## 5. Images, performance and security defaults

- [x] 5.1 Enable `@angular-eslint/template/prefer-ngsrc` as an error in `eslint.config.mjs`; verify `npm run lint` passes and fails on a temporary plain `<img src>`.
- [x] 5.2 Add the security headers middleware to `src/server.ts` (HTML not cached, hashed assets cached) and the same headers to `nginx.conf`; verify with `curl -I` against `serve:ssr` and an e2e or unit check.
- [x] 5.3 Add the same headers to the static nginx template in `scripts/configure-rendering.mjs`; verify `cli/test/configure-rendering.test.js` is updated and passes.
- [x] 5.4 Verify that the production HTML inlines the web font CSS with `font-display: swap`; if it does not, load the fonts so they do, and verify again on the built HTML.

## 6. Agent guidance and docs

- [x] 6.1 Write the "SEO, GEO and web quality" section in `CLAUDE.md` (per-page checklist, `SeoService` rule, image rules, `configure:seo`, run the skill before finishing UI work) and the new structure entries; verify every file, script and service it names exists (grep).
- [x] 6.2 Create `.claude/skills/web-quality-review/SKILL.md` (checklist, audit procedure, optional `npx lighthouse`, severity report, rendering-mode awareness); verify by running the skill on the template and checking its report lists only real findings.
- [x] 6.3 Update `README.md` and `README.en.md` (site URL, adding a page, images, accessibility, blocking AI crawlers, optional community skill packs, known 404 limitation in SSG/SPA); verify both stay in sync and link each other.
- [x] 6.4 Confirm generated projects get `.claude/skills/web-quality-review/` and a CLAUDE.md with no template placeholder left; extend `cli/test/generate.test.js` and verify with that test.
- [x] 6.5 Update the root `CLAUDE.md` Layout to mention the template's own `.claude/skills/`; verify the text matches the repo.

## 7. Integration

- [x] 7.1 Run `npm run verify` (or `npm run verify:quick`) and verify every template, both rendering conversions and the CLI tests pass.
- [x] 7.2 Run `openspec validate seo-geo-web-quality --strict` and verify it passes.

## 8. Placeholder domain guard

- [x] 8.1 Create `scripts/check-seo.mjs` (exports a function that returns the placeholder URLs found in `environment.prod.ts` and the three crawler files; CLI exits 1 naming each file and `npm run configure:seo -- --site-url ...`; exits 0 when `ALLOW_PLACEHOLDER_SITE_URL=1`) and add `"prebuild": "node scripts/check-seo.mjs"`; verify `npm run build` fails on the shipped template and passes with the bypass or after `configure:seo`.
- [x] 8.2 Add `cli/test/check-seo.test.js` running the check on copies of the real template files (placeholder fails, real domain passes, bypass passes, partial leftovers in one crawler file fail); verify with `node --test cli/test/check-seo.test.js`.
- [x] 8.3 Make `scripts/verify-templates.mjs` set `ALLOW_PLACEHOLDER_SITE_URL=1` for the template steps; verify the build step still passes in `npm run verify`.
- [x] 8.4 Add `validateSiteUrl` to `cli/src/validate.js`, the `--site-url` flag (public only, rejected for the backoffice and when invalid) and the optional `siteUrl` question after rendering, answered by the flag and skipped without a terminal; verify with tests in `cli/test/` (prompt sequences updated).
- [x] 8.5 Add the `configureSeo` generation step (runs the project's `scripts/configure-seo.mjs` only when a domain was given) and the summary lines for both cases; verify with `cli/test/generate.test.js`, `cli/test/run.test.js` and a summary test.
- [x] 8.6 Document it: template `CLAUDE.md`, both template READMEs, both root READMEs (wizard flag), and the wizard help text; verify the ES and EN texts match.
- [x] 8.7 Run `npm run verify` and `openspec validate seo-geo-web-quality --strict`; verify both pass.

## Workflow follow-up

- Sync the delta specs and archive the change after the review requirements are satisfied.
- Verify the archived specs reflect the shipped behavior.
