## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Defaults without a terminal
Without a terminal or with `--yes`, the wizard SHALL NOT ask the mock API, dark mode, output directory, git remote, initial commit and install questions and SHALL use their defaults (mock API included, light only, default location, no remote, no initial commit, no installation) unless the flags say otherwise.

#### Scenario: Non-interactive generation
- **WHEN** the wizard runs with `--type backoffice --name my-app --yes`
- **THEN** the project includes the mock API and supports only the light theme
- **AND** the repository has no remote and no commits, and no dependencies are installed

#### Scenario: Flags without a terminal
- **WHEN** the wizard runs with `--yes` and `--remote <url> --install`
- **THEN** the remote is set and dependencies are installed without any question

### Requirement: Next steps guidance
After generation the CLI SHALL print the commands still needed to start the project (leaving out installation when it already succeeded, and including the push command when a remote was set), and SHALL mention that `@coto-dev/ui-kit` is installed from the private registry configured in the generated project's `.npmrc`, which must be reachable from the user's network.

#### Scenario: Success message
- **WHEN** generation completes successfully
- **THEN** the CLI prints the start commands, and the install command when dependencies were not installed
- **AND** it prints a note about configuring registry access for `@coto-dev/ui-kit`
