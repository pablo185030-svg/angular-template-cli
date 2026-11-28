# website-web-quality Specification

## Purpose

Keeps the public website template accessible, fast and image-efficient by default, with automated checks that fail when pages regress against the web-quality practices Google recommends (WCAG 2.2 AA, Core Web Vitals, optimized images).

## Requirements

### Requirement: Skip to content link
The main layout SHALL start with a link, in Spanish, that is visually hidden until focused and moves keyboard focus to the main content. The main content region SHALL be a single `main` landmark.

#### Scenario: Keyboard user skips navigation
- **WHEN** a keyboard user presses Tab on a freshly loaded page
- **THEN** the first focused element is the skip link and it becomes visible
- **AND** activating it moves focus to the main content

#### Scenario: Pointer user
- **WHEN** the page is used with a pointer only
- **THEN** the skip link is not visible

### Requirement: Automated accessibility check
The template SHALL include an end-to-end test that scans every routed page, at a 320px and a desktop viewport and with the mobile drawer open, against WCAG 2.0, 2.1 and 2.2 level A and AA rules, and fails on any violation.

#### Scenario: Pages pass
- **WHEN** the end-to-end suite runs on the shipped template
- **THEN** the accessibility check passes on the home, about and not-found pages

#### Scenario: Regression caught
- **WHEN** a page is changed to contain an image without alternative text
- **THEN** the accessibility check fails

### Requirement: Page structure
Every page SHALL have exactly one `h1`, heading levels that do not skip, a Spanish `alt` text (or an empty one for decorative images) on every image, and links with discernible names.

#### Scenario: Single heading
- **WHEN** any shipped page is rendered
- **THEN** it contains exactly one `h1`

### Requirement: Optimized images
Raster and SVG images in templates SHALL be rendered through `NgOptimizedImage`, with explicit width and height. The lint check SHALL fail on a plain `src` image. Only the image that is the largest contentful element above the fold SHALL be marked as priority; all others SHALL load lazily.

#### Scenario: Plain image rejected
- **WHEN** a template uses `<img src="...">` instead of the optimized image directive
- **THEN** the lint check reports an error

#### Scenario: No layout shift
- **WHEN** an image is added following the rules
- **THEN** its space is reserved by its declared dimensions before it loads

### Requirement: Performance and security defaults
The production server and the shipped web server configuration SHALL compress text responses, cache hashed assets for a long time without caching HTML, and send baseline security headers (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` or an equivalent frame policy). Web fonts SHALL load with `font-display: swap`.

#### Scenario: Asset caching
- **WHEN** a hashed asset and the home page are requested
- **THEN** the asset response is cacheable for a year and the HTML response is not

#### Scenario: Security headers
- **WHEN** any page is requested from the production server
- **THEN** the response carries the baseline security headers

### Requirement: Web-quality documentation
Both READMEs SHALL document the SEO, GEO, accessibility and image rules, how to set the site URL, how to add a page that meets them, and how to block AI crawlers if the owner wants to.

#### Scenario: README sections
- **WHEN** a project is generated from the website template
- **THEN** its READMEs contain those topics
