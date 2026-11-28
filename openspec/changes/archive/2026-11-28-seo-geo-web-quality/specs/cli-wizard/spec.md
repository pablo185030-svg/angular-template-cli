# Spec Delta

## ADDED Requirements

### Requirement: Rendering mode options explain themselves
The rendering mode question SHALL show, above the options, one card per mode with the meaning of its acronym (Server-Side Rendering, Static Site Generation, Single Page Application), its pros, its cons and what it is best suited for, in Spanish. Each option label SHALL spell out its acronym and each hint SHALL be a short phrase.

#### Scenario: Options in the rendering question
- **WHEN** the rendering mode question is shown
- **THEN** the three cards are visible at the same time, above the options
- **AND** each card lists what the acronym means, pros, cons and an ideal use

#### Scenario: Narrow terminal
- **WHEN** the terminal is narrow
- **THEN** the cards wrap keeping their indentation, without breaking words

### Requirement: Production domain for the public website
When the app type is the public website, the wizard SHALL ask in Spanish for the production domain. The question MAY be left empty. The `--site-url <url>` flag SHALL answer it, SHALL accept only an absolute http(s) origin, and SHALL be rejected for the backoffice. Without a terminal or with `--yes` only the flag applies. A given domain SHALL be applied with the project's own `configure:seo` script as a reported step after the rendering step; otherwise the placeholder stays and no step runs.

#### Scenario: Domain given
- **WHEN** the user answers `https://www.mi-sitio.com` or passes `--site-url https://www.mi-sitio.com`
- **THEN** the generated project's environments, `robots.txt`, `sitemap.xml` and `llms.txt` use that origin
- **AND** the project builds for production without the placeholder guard failing

#### Scenario: Question left empty
- **WHEN** the user leaves the domain empty
- **THEN** the project keeps the placeholder and no configure step runs

#### Scenario: Invalid or misplaced flag
- **WHEN** `--site-url` is not an absolute http(s) origin, or is used with the backoffice
- **THEN** the CLI exits with a non-zero status and writes nothing

#### Scenario: Without a terminal
- **WHEN** the wizard runs with `--type public --name my-site --yes` and no `--site-url`
- **THEN** the question is not asked and the placeholder stays

### Requirement: Production domain question wording
The domain question SHALL say that the domain is asked for SEO, that pressing Enter without typing skips it, and that it is needed before the production build. When the chosen rendering mode is SPA it SHALL also explain that the site still publishes canonical, sitemap and metadata with that domain, so the question does not contradict the SPA SEO warning.

#### Scenario: SSR or SSG
- **WHEN** the question is shown for an SSR or SSG site
- **THEN** it names SEO as the reason, says Enter skips it, and says the domain is needed before the production build

#### Scenario: SPA
- **WHEN** the question is shown for an SPA site
- **THEN** it also explains that canonical, sitemap and metadata still use the domain despite the limited SEO

### Requirement: Production domain in the summary
For a public website, the final summary SHALL state the configured domain and remind the user to add its hostname to `ssr.allowedHosts` when the site is server-rendered. When no domain was given, it SHALL warn that the production build fails until `npm run configure:seo -- --site-url <url>` runs.

#### Scenario: Summary with a domain
- **WHEN** a public website is generated with a domain
- **THEN** the summary names the domain

#### Scenario: Summary without a domain
- **WHEN** a public website is generated without a domain
- **THEN** the summary warns that `npm run build` fails until `configure:seo` is run with the real domain
