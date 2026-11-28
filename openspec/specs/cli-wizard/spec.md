# cli-wizard Specification

## Purpose

Lets a developer generate a new, ready-to-run project from one of the repository's templates by answering a few prompts or passing flags, without manually copying or renaming files.

## Requirements

### Requirement: Interactive project generation
The CLI SHALL prompt the user for the application type (public website or backoffice) and the project name when they are not provided as flags, and SHALL generate the project in a new directory named after the project, created next to the repository that contains the CLI (a sibling, not inside it) unless an output directory is given.

#### Scenario: Generate from prompts
- **WHEN** the user runs the CLI without flags and answers the app type and project name prompts
- **THEN** a new directory named after the project is created containing the selected template

#### Scenario: Created next to the repository
- **WHEN** the user runs the CLI without an output directory
- **THEN** the project directory is created in the folder that contains the template repository
- **AND** nothing is created inside the template repository

#### Scenario: Generate from flags
- **WHEN** the user runs the CLI with the app type and project name flags
- **THEN** no prompt is shown and the project is generated with the given values

### Requirement: Optional Keycloak configuration
When the app type is backoffice, the CLI SHALL ask which environments the project has (`local` and `prod` always, plus any extra environments the user names) and SHALL offer to configure Keycloak (URL, realm and client id) for each of them. It SHALL write each environment's values into that environment's file in the generated project. The client id SHALL default to the project name, and every question after the first SHALL default to the previous environment's answer.

#### Scenario: Configure Keycloak in the wizard
- **WHEN** the user chooses backoffice, adds the environments `dev` and `qa`, and enters a different URL and realm for `local`, `dev`, `qa` and `prod`
- **THEN** the generated project has one environment file per environment, each containing its own Keycloak URL, realm and client id
- **AND** each of those environments can be built and served by its own configuration

#### Scenario: Skip Keycloak
- **WHEN** the user chooses backoffice and declines to configure Keycloak
- **THEN** the generated project starts in demo mode in local development
- **AND** the final summary explains how to connect Keycloak later, per environment

#### Scenario: Leave one environment unconfigured
- **WHEN** the user declines to configure Keycloak for a non-prod environment and configures the others
- **THEN** that environment's file keeps placeholder Keycloak values and the others contain their own values
- **AND** the final summary names the environments still to configure

#### Scenario: Keycloak flags without a terminal
- **WHEN** the CLI runs with `--environments dev,qa` and one `--keycloak <env>=<url>,<realm>` flag per environment and no terminal
- **THEN** no question is asked and each environment's values are written to the generated project

#### Scenario: Legacy single-environment flags
- **WHEN** the CLI runs with the Keycloak URL and realm flags and no environment flags
- **THEN** the same values are written to every environment of the project

#### Scenario: Keycloak with a public site
- **WHEN** Keycloak or environment flags are given together with the public website type
- **THEN** the CLI exits with a non-zero status and writes nothing

#### Scenario: Invalid Keycloak values
- **WHEN** the URL does not start with http:// or https://, or the realm or client id contains spaces
- **THEN** the CLI rejects the value, and in the guided flow lets the user correct it

#### Scenario: Invalid environment names
- **WHEN** an environment name is not lowercase kebab-case, repeats another, or is `e2e`
- **THEN** the CLI rejects it before writing any file, and in the guided flow lets the user correct it

### Requirement: Placeholder replacement
The CLI SHALL replace the template's placeholder name `coto-angular-template` with the project name chosen by the user in every generated file that contains it, including package metadata and page titles.

#### Scenario: Project name applied
- **WHEN** a project named `my-shop` is generated
- **THEN** the generated `package.json` name is `my-shop`
- **AND** the text `coto-angular-template` does not appear in any generated file

### Requirement: Safe target directory
The CLI MUST NOT overwrite an existing non-empty directory, and SHALL reject invalid project names before writing any file.

#### Scenario: Target directory exists
- **WHEN** the target directory already exists and is not empty
- **THEN** the CLI exits with a non-zero status and an explanatory message
- **AND** no existing file is modified

#### Scenario: Invalid project name
- **WHEN** the project name contains spaces, uppercase letters or path separators
- **THEN** the CLI rejects it with a message describing the allowed format and writes nothing

### Requirement: Clean generated project
The generated project SHALL NOT include the template repository's git history, build output or installed dependencies, and SHALL start as a fresh git repository on the `main` branch.

#### Scenario: Fresh repository
- **WHEN** generation completes
- **THEN** the project contains its own new git repository with no history from the template repository
- **AND** it contains no `node_modules` or build output directories

### Requirement: Next steps guidance
After generation the CLI SHALL print the commands still needed to start the project (leaving out installation when it already succeeded, and including the push command when a remote was set), and SHALL mention that `@coto-dev/ui-kit` is installed from the private registry configured in the generated project's `.npmrc`, which must be reachable from the user's network.

#### Scenario: Success message
- **WHEN** generation completes successfully
- **THEN** the CLI prints the start commands, and the install command when dependencies were not installed
- **AND** it prints a note about configuring registry access for `@coto-dev/ui-kit`

### Requirement: Spanish user-facing text
All text the CLI shows to the user (prompts, step names, errors, help and summary) SHALL be in Spanish.

#### Scenario: Spanish help
- **WHEN** the user runs the CLI with the help flag
- **THEN** the usage text is shown in Spanish

### Requirement: Polished interactive experience
In an interactive terminal the CLI SHALL open full screen (alternate screen buffer) and restore the terminal when it ends, whatever the reason. It SHALL present a branded header with an animated pixel mascot, guided prompts with a selectable list for the app type, inline validation of the project name, a progress indicator for each generation step, and a styled final summary. The final summary SHALL remain visible in the terminal after the CLI exits.

#### Scenario: Guided flow
- **WHEN** the user runs the CLI in an interactive terminal without flags
- **THEN** the screen switches to full screen and a header with the mascot is shown, followed by the app type selection and the project name prompt
- **AND** each generation step shows progress and a success or failure state

#### Scenario: Animated mascot
- **WHEN** the CLI starts and while the generation steps run
- **THEN** the mascot is animated (for example blinking and moving its legs)

#### Scenario: Terminal restored
- **WHEN** the CLI finishes, fails, is cancelled or receives Ctrl+C
- **THEN** the terminal leaves full screen, the cursor is visible again and the previous terminal content is back

#### Scenario: Summary kept
- **WHEN** generation completes
- **THEN** the final summary with the next steps is printed in the normal terminal after leaving full screen

#### Scenario: Inline validation
- **WHEN** the user types an invalid project name at the prompt
- **THEN** the prompt shows why it is invalid and lets the user correct it without restarting

#### Scenario: Cancellation
- **WHEN** the user cancels a prompt with Ctrl+C
- **THEN** the CLI exits with a cancellation message and writes nothing

### Requirement: Non-interactive fallback
When not attached to an interactive terminal, or when `--yes` is passed with all required flags, the CLI SHALL skip animations and prompts and print plain text output.

#### Scenario: Piped output
- **WHEN** the CLI runs in a CI job with all required flags and no terminal attached
- **THEN** it generates the project and prints plain log lines without animation or color control codes

### Requirement: Cross-platform operation
The CLI SHALL run on macOS, Linux and Windows with only Node.js installed, and SHALL be runnable from a clone of this repository.

#### Scenario: Windows execution
- **WHEN** the CLI is run on Windows with Node.js available
- **THEN** it generates the same project content as on macOS or Linux

### Requirement: Optional mock API for the backoffice
When the app type is backoffice, the wizard SHALL ask whether to include the mock API, explaining in Spanish, in at most three short sentences, what it is (a local server that simulates the products API so the example works without a backend) and what happens if it is declined (the products load from a JSON file and changes are lost on reload). The default SHALL be to include it. The `--no-mock-api` flag SHALL answer the question negatively and SHALL be rejected for the public template.

#### Scenario: Include the mock API
- **WHEN** the user generates a backoffice and accepts the default
- **THEN** the project contains the mock API server and its `mock:api` script

#### Scenario: Decline the mock API
- **WHEN** the user generates a backoffice and declines the mock API, or passes `--no-mock-api`
- **THEN** the project contains no mock API server or `mock:api` script
- **AND** the products example is configured to use the JSON data source

#### Scenario: Not asked for the public template
- **WHEN** the user generates a public site
- **THEN** the wizard does not ask about the mock API

### Requirement: Optional dark mode
For both app types, the wizard SHALL ask whether the project should support dark mode. The default SHALL be no, and the `--dark-mode` flag SHALL answer yes. The generated project SHALL be configured accordingly.

#### Scenario: Light only
- **WHEN** the user declines dark mode or leaves the default
- **THEN** the generated project is configured for the light theme only and shows no theme toggle

#### Scenario: Dark mode supported
- **WHEN** the user accepts dark mode or passes `--dark-mode`
- **THEN** the generated project supports both themes, starts in light mode and shows a theme toggle

### Requirement: Defaults without a terminal
Without a terminal or with `--yes`, the wizard SHALL NOT ask the mock API, dark mode, output directory, git remote, initial commit and install questions and SHALL use their defaults (mock API included, light only, default location, no remote, no initial commit, no installation) unless the flags say otherwise.

#### Scenario: Non-interactive generation
- **WHEN** the wizard runs with `--type backoffice --name my-app --yes`
- **THEN** the project includes the mock API and supports only the light theme
- **AND** the repository has no remote and no commits, and no dependencies are installed

#### Scenario: Flags without a terminal
- **WHEN** the wizard runs with `--yes` and `--remote <url> --install`
- **THEN** the remote is set and dependencies are installed without any question

### Requirement: Mock API clarified as a mock
The wizard's mock API question SHALL state concisely that the mock simulates the products API and that the products ABM is only a sample to be replaced. For a backoffice, the final summary SHALL also state that the products ABM is only a sample.

#### Scenario: Explanation
- **WHEN** the wizard asks whether to include the mock API
- **THEN** the question says the mock is a local server that simulates the products API with sample data
- **AND** it says the products ABM is only a sample to be replaced

#### Scenario: Summary note
- **WHEN** a backoffice is generated
- **THEN** the final summary says the products ABM is only a sample that can be removed or replaced

### Requirement: Output directory question
In an interactive terminal, when `--out` is not given, the wizard SHALL ask where to create the project, with the folder that contains the template repository as the default. The project is created in a directory named after the project inside the chosen location.

#### Scenario: Default location
- **WHEN** the user accepts the default at the location prompt
- **THEN** the project directory is created next to the template repository

#### Scenario: Custom location
- **WHEN** the user enters another directory, or passes `--out`
- **THEN** the project directory is created inside it and no location question is asked when the flag was given

### Requirement: Git remote question
The wizard SHALL ask whether the user already has a git repository for the project and, if so, its URL, and SHALL register it as the `origin` remote of the generated repository. The `--remote <url>` flag SHALL answer both questions. The CLI MUST NOT push to the remote; when a remote was set, the final summary SHALL show the push command.

#### Scenario: Remote provided
- **WHEN** the user says they have a repository and enters a URL, or passes `--remote <url>`
- **THEN** the generated repository has an `origin` remote with that URL
- **AND** nothing is pushed
- **AND** the summary shows `git push -u origin main`

#### Scenario: No remote
- **WHEN** the user says they do not have a repository
- **THEN** no remote is configured and the summary does not mention pushing

#### Scenario: Empty URL
- **WHEN** the URL is empty or contains spaces
- **THEN** the prompt rejects it and lets the user correct it

### Requirement: Initial commit question
The wizard SHALL ask whether to create an initial commit in the generated repository, defaulting to yes. The `--no-commit` flag SHALL answer it negatively.

#### Scenario: Commit created
- **WHEN** the user accepts the initial commit
- **THEN** the generated repository has one commit on `main` with all generated files

#### Scenario: Commit declined
- **WHEN** the user declines, or passes `--no-commit`
- **THEN** the repository is initialized with no commits

#### Scenario: Commit fails
- **WHEN** git cannot create the commit (for example, no user configured)
- **THEN** the CLI reports the problem, keeps the generated project and the rest of the generation completes

### Requirement: Install dependencies question
The wizard SHALL ask whether to install dependencies now, defaulting to no, warning that it needs access to the private registry that serves `@coto-dev/ui-kit`. The `--install` and `--no-install` flags SHALL answer it. A failed installation MUST NOT abort the CLI nor delete the generated project.

#### Scenario: Install accepted
- **WHEN** the user accepts, or passes `--install`
- **THEN** the CLI runs `npm install` in the generated project as a reported step
- **AND** the summary does not list `npm install` as a next step

#### Scenario: Install fails
- **WHEN** `npm install` fails
- **THEN** the error is shown, the project is kept, the CLI finishes
- **AND** the summary lists `npm install` as a next step

#### Scenario: Install declined
- **WHEN** the user declines, or passes `--no-install`
- **THEN** nothing is installed and the summary lists `npm install` as a next step

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

### Requirement: Back navigation in the guided flow
In an interactive terminal the wizard SHALL let the user press Esc to return to the previous question and change its answer, and SHALL keep Ctrl+C as the way to exit. Going back SHALL skip questions that were not asked (answered by a flag or not applicable to the chosen app type) and SHALL offer the previous answer as the initial value. Pressing Esc on the first question SHALL leave the wizard on that question. The wizard SHALL tell the user which keys go back and which exit.

#### Scenario: Go back and change an answer
- **WHEN** the user answers the project name, then the location, and presses Esc on the next question
- **THEN** the location question is shown again with the previous answer as its initial value
- **AND** changing it and continuing uses the new value

#### Scenario: Back skips questions that were not asked
- **WHEN** the user generates a public website and presses Esc on the first question after the dark mode question
- **THEN** the dark mode question is shown, not the Keycloak or mock API questions

#### Scenario: Back over flag-provided answers
- **WHEN** the project name was given as a flag and the user presses Esc on the first asked question
- **THEN** the wizard stays on that question

#### Scenario: Ctrl+C still exits
- **WHEN** the user presses Ctrl+C on any question, including after going back
- **THEN** the CLI exits with a cancellation message and status 130 and writes nothing

#### Scenario: Keys hint
- **WHEN** a question is shown in the guided flow
- **THEN** a hint says that Esc goes back and Ctrl+C exits

#### Scenario: No change without a terminal
- **WHEN** the wizard runs without a terminal or with `--yes`
- **THEN** no question is asked and the resulting options are the same as before this requirement

### Requirement: Readable questions
In an interactive terminal the wizard SHALL wrap every question to the terminal width so that no part of its text is cut off, keeping the text of the question itself unchanged.

#### Scenario: Long question
- **WHEN** a question is longer than the terminal width
- **THEN** it is shown over several lines and all of its text is visible

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

### Requirement: Redirect URIs in the summary
For a backoffice with Keycloak configured, the final summary SHALL list the environments and say that each Keycloak client needs the application's URL for that environment as a valid redirect URI.

#### Scenario: Summary lists environments
- **WHEN** a backoffice with the environments `local`, `dev` and `prod` is generated
- **THEN** the summary names the three environments and the redirect URI to register for local development
