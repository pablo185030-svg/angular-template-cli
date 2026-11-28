# Proposal

## Why

The public website template is server-side rendered, but it ships none of the SEO, GEO (generative engine optimization) and web-quality basics that Google and AI search engines expect: pages share one static title, there is no description, canonical URL, Open Graph data, structured data, `robots.txt` or sitemap, the not-found page is served with HTTP 200 (a soft 404), and nothing prevents accessibility or image regressions as the team adds pages. Instructions alone drift, so every project generated from the template has to inherit both the baseline and the guardrails that keep it in place.

## What Changes

- Add a route-driven SEO layer: a Spanish title and description per route, canonical URL, Open Graph and Twitter tags, robots directives and JSON-LD helpers, all behind one service so pages never touch `document` or `<meta>` directly.
- Add a single `siteUrl` setting to the environments, and a `configure:seo` script that propagates it to the static crawler files.
- Ship `robots.txt`, `sitemap.xml` and `llms.txt` in `public/`, with unit tests that fail when a route is missing from the sitemap or a URL disagrees with `siteUrl`.
- Serve the not-found page with HTTP 404 and `noindex` under SSR.
- Add WebSite and Organization JSON-LD to the home page.
- Add web-quality baselines: a skip-to-content link, an automated WCAG 2.2 AA check in Playwright (axe) on every route at mobile and desktop widths, a lint rule that requires `NgOptimizedImage` for images, and image and performance guidance.
- Add agent guidance: a "SEO, GEO and web quality" section in the template `CLAUDE.md` with a per-page checklist, and a small `web-quality-review` skill in `templates/public/.claude/skills/` for on-demand audits (checklist plus optional Lighthouse).
- Document all of it in both READMEs, and keep it working after `configure:rendering` converts the project to SSG or SPA.

- Add a guard against shipping the placeholder domain: a production build that fails while `siteUrl` or a crawler file still holds `example.com`, and a wizard question (and `--site-url` flag) for the production domain.

Out of scope: vendoring third-party SEO skill packs, Lighthouse CI in the pipeline, a default Open Graph image, and the backoffice template.

## Capabilities

### New Capabilities
- `public-seo`: Per-route metadata, canonical and social tags, crawler files (`robots.txt`, `sitemap.xml`, `llms.txt`), structured data, correct 404 status, and the `siteUrl` setting with its script.
- `public-web-quality`: Accessibility baseline (skip link, automated WCAG 2.2 AA checks), image handling rules enforced by lint, and the documentation of these guarantees.
- `public-agent-guidance`: The template-level instructions and skill that make AI coding agents respect the SEO, GEO and web-quality rules in every generated project.

### Modified Capabilities
- `cli-wizard`: asks for the production domain of a public website (optional) and applies it with the template's own `configure:seo` script.

The existing `public-template` requirements stay as they are; the rest of the new behavior is added through the capabilities above.

## Impact

- `templates/public/`: `src/index.html`, `src/app/app.routes.ts`, `src/app/app.config.ts`, `src/app/core/services/` (SEO service, title strategy), `src/app/shared/layouts/main-layout/`, home and not-found pages, `src/environments/*`, `public/` (new files), `scripts/configure-seo.mjs`, `scripts/configure-rendering.mjs` (must keep the new files and settings working), `eslint.config.mjs`, `e2e/` (axe spec), `package.json` (`@axe-core/playwright`, new script), `CLAUDE.md`, `README.md`, `README.en.md`, `.claude/skills/web-quality-review/`.
- `cli/`: new optional `--site-url` flag and question for the public website, a generation step, a summary note, and updated tests (prompt sequences of the public flow gain one answer).
- `templates/public/`: also `scripts/check-seo.mjs` and a `prebuild` npm script; `scripts/verify-templates.mjs` sets the bypass variable.
- Root `CLAUDE.md`: mention that the public template carries its own `.claude/skills/`.
- New devDependency: `@axe-core/playwright`.
