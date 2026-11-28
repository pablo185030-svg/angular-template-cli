---
name: web-quality-review
description: Audit this website for SEO, GEO (AI answer engine visibility), accessibility, image and performance best practices, and report findings by severity. Use when finishing a UI or content change, adding a page, or when the user asks for an SEO, GEO, accessibility, Lighthouse or Core Web Vitals review.
---

# Web quality review

Audit the site against the rules in the "SEO, GEO and web quality" section of `AGENTS.md`. Read that section first: it is the source of truth, and this skill only says how to check it. Report problems, do not fix them unless the user asks.

## 1. Know the project

- Read `angular.json`: `outputMode: "server"` means SSR, `"static"` means SSG, no `ssr` block means SPA. Some checks differ (see "By rendering mode").
- Read `src/environments/environment.prod.ts` for `siteUrl` and `siteName`.
- List the routes in `src/app/app.routes.ts` and the URLs in `public/sitemap.xml`.

## 2. Run the executable guardrails

Run these and report any failure as a **blocker** with its output:

```bash
npm run lint
npm test
npx playwright test a11y seo
```

If Playwright browsers are missing, run `npx playwright install chromium` once and say so.

## 3. Inspect the built output

```bash
npm run build
```

Then for every route, read the rendered HTML (SSR: `PORT=4000 npm run serve:ssr` and `curl -s localhost:4000<path>`; SSG: `dist/<project>/browser/<path>/index.html`; SPA: only the app shell exists, so check metadata in the browser instead).

| Check | Look for | Severity if wrong |
| --- | --- | --- |
| Title | One `<title>`, Spanish, `<page> \| <siteName>`, under about 60 characters | blocker if missing, warning if long |
| Description | One `<meta name="description">`, unique per page, about 70-160 characters | blocker if missing, warning if duplicated or off-length |
| Canonical | One `<link rel="canonical">` with the absolute `siteUrl` and the page path; none on `noindex` pages | blocker |
| Open Graph / Twitter | `og:title`, `og:description`, `og:url`, `og:type`, `og:locale`, `twitter:card`; `og:image` only when a page defines an image | warning |
| `siteUrl` | Not `https://www.example.com` in a project being released | blocker for a release, otherwise suggestion |
| Structured data | Valid JSON-LD with `@context`; no duplicates; matches visible content | warning |
| Headings | Exactly one `h1`; no skipped levels | blocker |
| Content in HTML | The main content is in the server HTML (not rendered only in the browser) | blocker |
| Images | `ngSrc` with width and height, Spanish `alt` (or empty when decorative), `priority` only on the LCP image, modern formats | warning |
| Links | Descriptive text (not "click here"), external links with `rel="noopener noreferrer"` | warning |
| 404 | Unknown path answers HTTP 404 (SSR only), has `noindex`, is not in the sitemap | blocker (SSR) |
| Security headers | `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`; HTML `Cache-Control: no-cache`; hashed assets cached for a year (`curl -I`) | warning |

## 4. Crawler and GEO files

- `public/robots.txt`: allows `*`, has an absolute `Sitemap:` line. Blocking AI crawlers must be a deliberate, documented choice.
- `public/sitemap.xml`: every indexable route, absolute URLs, no `noindex` page.
- `public/llms.txt`: describes the site and links the main pages. It is optional and its effect on search engines is unproven: never report it as a blocker.
- GEO content review (read the page copy, not just the markup): each page answers one clear question near the top, uses descriptive headings, states facts with dates and sources when relevant, and names the organization consistently. These are suggestions.

## 5. Lighthouse (optional)

Only when the user wants scores or the checks above are not enough. Needs a running build and Chrome; it adds no dependency to the project:

```bash
npm run build && PORT=4000 npm run serve:ssr   # in another terminal
npx lighthouse http://localhost:4000/ --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=./lighthouse-home.json --chrome-flags="--headless"
```

Report the four category scores and the failing audits. Lab scores are not field data: say so, and do not claim Core Web Vitals pass or fail from them. Delete the report file when done. If Lighthouse or Chrome is unavailable, say which checks were skipped and continue.

## By rendering mode

- **SSR**: every check above applies.
- **SSG**: no live HTTP status; check that each route has its own prerendered `index.html` with the metadata. The 404 and security-header checks apply to the nginx config, not to a running server.
- **SPA**: metadata is set in the browser, so crawlers that do not run JavaScript will not see it. Report this once as a **warning** and recommend SSR or SSG for public content. The server-HTML checks cannot pass; mark them as not applicable instead of failing them.

## Report format

Reply in the language the user is writing in. Group findings by severity, each with the file or URL, what is wrong, and the fix. End with what was checked and what was skipped.

```
## Web quality review
Rendering mode: SSR - siteUrl: https://...

### Blockers
- `/acerca-de`: no meta description (src/app/app.routes.ts). Add `data.seo.description`.

### Warnings
- ...

### Suggestions
- ...

### Checked
lint, unit tests, a11y + seo e2e, built HTML for 3 routes, crawler files.
### Skipped
Lighthouse (Chrome not available).
```

Never invent findings. If a check passes, do not list it as a finding.
