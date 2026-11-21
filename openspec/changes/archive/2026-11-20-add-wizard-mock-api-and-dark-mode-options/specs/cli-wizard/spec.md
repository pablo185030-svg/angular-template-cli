## ADDED Requirements

### Requirement: Optional mock API for the backoffice
When the app type is backoffice, the wizard SHALL ask whether to include the mock API, explaining in Spanish what it is (a small local server that makes the products example work without a backend) and what happens if it is declined (the example loads its data from a JSON file and keeps changes only in browser memory). The default SHALL be to include it. The `--no-mock-api` flag SHALL answer the question negatively and SHALL be rejected for the public template.

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
Without a terminal or with `--yes`, the wizard SHALL NOT ask the mock API and dark mode questions and SHALL use their defaults (mock API included, light only) unless the flags say otherwise.

#### Scenario: Non-interactive generation
- **WHEN** the wizard runs with `--type backoffice --name my-app --yes`
- **THEN** the project includes the mock API and supports only the light theme
