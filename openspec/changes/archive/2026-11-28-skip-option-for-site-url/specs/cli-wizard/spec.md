# Spec Delta

## MODIFIED Requirements

### Requirement: Production domain for the public website
When the app type is the public website, the wizard SHALL ask in Spanish for the production domain, first offering a selectable choice between entering it now and skipping it for now; only the first choice shows the domain text prompt, which MAY be left empty. The `--site-url <url>` flag SHALL answer it, SHALL accept only an absolute http(s) origin, and SHALL be rejected for the backoffice. Without a terminal or with `--yes` only the flag applies. A given domain SHALL be applied with the project's own `configure:seo` script as a reported step after the rendering step; otherwise the placeholder stays and no step runs.

#### Scenario: Domain given
- **WHEN** the user chooses to enter the domain and answers `https://www.mi-sitio.com`, or passes `--site-url https://www.mi-sitio.com`
- **THEN** the generated project's environments, `robots.txt`, `sitemap.xml` and `llms.txt` use that origin
- **AND** the project builds for production without the placeholder guard failing

#### Scenario: Skip chosen
- **WHEN** the user chooses to skip the domain for now
- **THEN** the domain text prompt is not shown, the project keeps the placeholder and no configure step runs

#### Scenario: Question left empty
- **WHEN** the user chooses to enter the domain and leaves it empty
- **THEN** the project keeps the placeholder and no configure step runs

#### Scenario: Invalid or misplaced flag
- **WHEN** `--site-url` is not an absolute http(s) origin, or is used with the backoffice
- **THEN** the CLI exits with a non-zero status and writes nothing

#### Scenario: Without a terminal
- **WHEN** the wizard runs with `--type public --name my-site --yes` and no `--site-url`
- **THEN** the question is not asked and the placeholder stays

### Requirement: Production domain question wording
The skip choice SHALL be labeled in Spanish as skipping for now and say the domain can be set later with `npm run configure:seo`. The domain text prompt SHALL say that the domain is asked for SEO, that pressing Enter without typing skips it, and that it is needed before the production build. When the chosen rendering mode is SPA it SHALL also explain that the site still publishes canonical, sitemap and metadata with that domain, so the question does not contradict the SPA SEO warning.

#### Scenario: SSR or SSG
- **WHEN** the domain text prompt is shown for an SSR or SSG site
- **THEN** it names SEO as the reason, says Enter skips it, and says the domain is needed before the production build

#### Scenario: SPA
- **WHEN** the domain text prompt is shown for an SPA site
- **THEN** it also explains that canonical, sitemap and metadata still use the domain despite the limited SEO

#### Scenario: Skip choice wording
- **WHEN** the domain choice is shown
- **THEN** one option skips the domain and mentions `npm run configure:seo` as the way to set it later
