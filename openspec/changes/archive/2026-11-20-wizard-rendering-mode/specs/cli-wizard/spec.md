## ADDED Requirements

### Requirement: Rendering mode for the public website
When the app type is the public website, the wizard SHALL ask how the site is rendered, offering SSR (server-side rendering), SSG (static prerendering, no Node server) and SPA (client only), explaining each in Spanish and warning that SPA loses SEO. The default SHALL be SSR. The `--rendering <ssr|ssg|spa>` flag SHALL answer the question, SHALL be validated against those values, and SHALL be rejected for the backoffice. The question SHALL NOT be asked for the backoffice.

#### Scenario: SSR by default
- **WHEN** the user generates a public website and accepts the default
- **THEN** the project is the unchanged server-side rendered template

#### Scenario: Choose SSG or SPA
- **WHEN** the user picks SSG or SPA, or passes `--rendering ssg` or `--rendering spa`
- **THEN** the project is converted to that mode as a reported generation step

#### Scenario: Invalid or misplaced flag
- **WHEN** `--rendering` has another value, or is used with the backoffice
- **THEN** the CLI exits with a non-zero status and writes nothing

#### Scenario: Not asked for the backoffice
- **WHEN** the user generates a backoffice
- **THEN** the wizard does not ask about the rendering mode

### Requirement: Rendering mode default without a terminal
Without a terminal or with `--yes`, the wizard SHALL NOT ask the rendering mode question and SHALL use SSR unless `--rendering` says otherwise.

#### Scenario: Non-interactive public site
- **WHEN** the wizard runs with `--type public --name my-site --yes`
- **THEN** the project keeps server-side rendering

### Requirement: Rendering mode in the summary
For a public website, the final summary SHALL state the chosen rendering mode. When the mode is SSR it SHALL also show how to convert it later with `npm run configure:rendering`; when it is SSG or SPA it SHALL say that going back to SSR means regenerating the project or using git.

#### Scenario: Summary note
- **WHEN** a public website is generated
- **THEN** the summary names the rendering mode
- **AND** for SSR it shows the command to convert it later, and for SSG or SPA it explains how to go back
