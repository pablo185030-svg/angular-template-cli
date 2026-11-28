# public-seo Specification

## Purpose

Makes every page of the public website template discoverable and citable by search engines and AI answer engines, through per-page metadata, crawler files, structured data and correct HTTP status codes, all derived from a single configured site URL.

## Requirements

### Requirement: Site URL setting
The public template SHALL read the public base URL of the site from a single `siteUrl` setting in its environments. Every absolute URL the template emits (canonical, social tags, sitemap, structured data) SHALL be derived from it. The shipped value SHALL be an obvious placeholder.

#### Scenario: One source of truth
- **WHEN** `siteUrl` is changed in the environments
- **THEN** canonical, Open Graph and structured-data URLs use the new value

#### Scenario: Script updates static files
- **WHEN** `npm run configure:seo -- --site-url https://www.example.org` runs
- **THEN** the environments, `robots.txt`, `sitemap.xml` and `llms.txt` use `https://www.example.org`
- **AND** a value that is not an absolute http(s) URL makes the script exit with an error and change nothing

### Requirement: Per-route title and description
Every routed page of the public template SHALL declare a Spanish title and a Spanish meta description. The document title SHALL be the page title followed by the site name. The metadata SHALL be present in the server-rendered HTML and SHALL change when the user navigates.

#### Scenario: Server-rendered metadata
- **WHEN** the server renders the about page
- **THEN** the HTML contains the about title and its own meta description

#### Scenario: Client navigation
- **WHEN** the user navigates from the home page to the about page
- **THEN** the document title and meta description change to the about page values

#### Scenario: Route without a description
- **WHEN** a route declares a title but no description
- **THEN** the unit test suite fails

### Requirement: Canonical and social tags
Each page SHALL expose a canonical link built from `siteUrl` and the page path, Open Graph tags (`og:title`, `og:description`, `og:url`, `og:type`, `og:locale`) and Twitter card tags. An image tag SHALL be emitted only when a page provides an image.

#### Scenario: Canonical per page
- **WHEN** the home page and the about page are rendered
- **THEN** each has exactly one canonical link pointing at its own absolute URL

#### Scenario: No image by default
- **WHEN** a page provides no image
- **THEN** no `og:image` tag is emitted

### Requirement: Robots directives for non-indexable pages
A route SHALL be able to mark itself as non-indexable. Such a page SHALL emit a `noindex` robots meta tag and SHALL be absent from the sitemap. Indexable pages SHALL NOT emit `noindex`.

#### Scenario: Not-found page
- **WHEN** the not-found page is rendered
- **THEN** it contains a `noindex` robots meta tag

### Requirement: Correct not-found status
Under server-side rendering the template SHALL answer unknown paths with HTTP status 404 and the not-found page content, and known paths with 200.

#### Scenario: Unknown path
- **WHEN** the production server receives a request for a path that matches no page
- **THEN** the response status is 404 and the body contains the not-found page

#### Scenario: Known path
- **WHEN** the production server receives a request for the home page
- **THEN** the response status is 200

### Requirement: Crawler files
The template SHALL ship `robots.txt`, `sitemap.xml` and `llms.txt` at the site root. `robots.txt` SHALL allow all crawlers, including AI crawlers, and reference the sitemap by absolute URL. `sitemap.xml` SHALL list every indexable route with an absolute URL. `llms.txt` SHALL describe the site and link its main pages.

#### Scenario: Sitemap covers every route
- **WHEN** a new indexable route is added without a sitemap entry
- **THEN** the unit test suite fails

#### Scenario: Files served
- **WHEN** the production server or static host receives a request for `/robots.txt`, `/sitemap.xml` or `/llms.txt`
- **THEN** it responds 200 with the file content

#### Scenario: URLs match the setting
- **WHEN** a URL in a crawler file does not start with the configured `siteUrl`
- **THEN** the unit test suite fails

### Requirement: Structured data
The home page SHALL emit valid JSON-LD for a `WebSite` and an `Organization` in the server-rendered HTML. Pages SHALL be able to add their own JSON-LD, which is replaced on navigation and never duplicated.

#### Scenario: Home structured data
- **WHEN** the server renders the home page
- **THEN** the HTML contains one `application/ld+json` script with `WebSite` and `Organization` data using `siteUrl`

#### Scenario: Navigation replaces data
- **WHEN** the user navigates from a page that adds JSON-LD to another page
- **THEN** the previous JSON-LD is no longer in the document

### Requirement: SEO survives rendering conversion
The SEO behavior SHALL keep working after `configure:rendering` converts the project. In SSG the metadata of every prerendered route SHALL be in its HTML, and the crawler files SHALL be served by the static host. In SPA the crawler files SHALL be served and metadata SHALL be set at runtime.

#### Scenario: Prerendered metadata
- **WHEN** the project is converted to SSG and built
- **THEN** the prerendered HTML of each route contains its title, description and canonical link

#### Scenario: Static host files
- **WHEN** the project is converted to SSG or SPA
- **THEN** `robots.txt`, `sitemap.xml` and `llms.txt` are part of the build output

### Requirement: Placeholder domain guard
The public template SHALL refuse a production build while the site URL is still a placeholder (`example.com`, `example.org` or `example.net`) in the production environment or in `robots.txt`, `sitemap.xml` or `llms.txt`. The check SHALL name every offending file and the `configure:seo` command, SHALL run automatically before `npm run build` only, and SHALL be skippable with `ALLOW_PLACEHOLDER_SITE_URL=1`.

#### Scenario: Placeholder in production build
- **WHEN** `npm run build` runs on a project whose `siteUrl` is still `https://www.example.com`
- **THEN** the build stops with a non-zero status before compiling
- **AND** the message lists the files that hold the placeholder and the `npm run configure:seo -- --site-url` command

#### Scenario: Domain configured
- **WHEN** `configure:seo` has set a real domain and `npm run build` runs
- **THEN** the guard passes and the build continues

#### Scenario: Leftover in a crawler file
- **WHEN** `siteUrl` is a real domain but one crawler file still contains an `example.com` URL
- **THEN** the guard fails and names that file

#### Scenario: Explicit bypass
- **WHEN** `ALLOW_PLACEHOLDER_SITE_URL=1` is set
- **THEN** the guard passes without checking, so the template's own verification can build it

#### Scenario: Development is not blocked
- **WHEN** the user runs `npm start`, `npm test` or `npm run build:dev` with the placeholder
- **THEN** the guard does not run
