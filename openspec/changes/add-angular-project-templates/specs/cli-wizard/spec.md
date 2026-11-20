# Spec Delta

## Purpose

Lets a developer generate a new, ready-to-run project from one of the repository's templates by answering a few prompts or passing flags, without manually copying or renaming files.

## ADDED Requirements

### Requirement: Interactive project generation
The CLI SHALL prompt the user for the application type (public website or backoffice) and the project name when they are not provided as flags, and SHALL generate the project in a new directory named after the project.

#### Scenario: Generate from prompts
- **WHEN** the user runs the CLI without flags and answers the app type and project name prompts
- **THEN** a new directory named after the project is created containing the selected template

#### Scenario: Generate from flags
- **WHEN** the user runs the CLI with the app type and project name flags
- **THEN** no prompt is shown and the project is generated with the given values

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
After generation the CLI SHALL print the commands needed to install dependencies and start the project, and SHALL mention that `@coto-dev/ui-kit` is installed from the private registry configured in the generated project's `.npmrc`, which must be reachable from the user's network.

#### Scenario: Success message
- **WHEN** generation completes successfully
- **THEN** the CLI prints the install and start commands for the generated project
- **AND** it prints a note about configuring registry access for `@coto-dev/ui-kit`

### Requirement: Polished interactive experience
In an interactive terminal the CLI SHALL present a branded welcome banner, guided prompts with a selectable list for the app type, inline validation of the project name, a progress indicator for each generation step, and a styled final summary.

#### Scenario: Guided flow
- **WHEN** the user runs the CLI in an interactive terminal without flags
- **THEN** a welcome banner is shown followed by the app type selection and the project name prompt
- **AND** each generation step shows progress and a success or failure state

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
