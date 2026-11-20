# Spec Delta

## Purpose

Provides a simple but functional starting point for a public-facing website, server-side rendered and styled with the shared Coto design system, with a main layout and two example pages.

## ADDED Requirements

### Requirement: Buildable and runnable out of the box
The public template SHALL install, build, run and pass its tests without any modification after generation, given access to the private registry.

#### Scenario: Fresh project works
- **WHEN** a project is generated from the public template and dependencies are installed
- **THEN** the build, the unit tests and the lint check complete successfully
- **AND** the development server serves the home page

### Requirement: Server-side rendering
The public template SHALL render pages on the server and provide a production server entry point and container image definition.

#### Scenario: Server-rendered response
- **WHEN** the production server receives a request for the home page
- **THEN** the response HTML contains the rendered page content

### Requirement: Folder scaffolding
The public template SHALL organize application code into `core/` (app-wide singletons), `shared/` (reusable layouts and components) and `domains/` (one folder per feature area), with kebab-case folder and file names.

#### Scenario: Scaffolding present
- **WHEN** a project is generated from the public template
- **THEN** the application source contains `core/`, `shared/` and `domains/` directories
- **AND** `domains/` contains one folder each for the home and about pages

### Requirement: Main layout
The public template SHALL provide a main layout composed of a header, the routed page content and a footer, shared by all pages.

#### Scenario: Layout on every page
- **WHEN** the user visits any page of the application
- **THEN** the header and the footer are displayed around the page content

### Requirement: Home and about pages
The public template SHALL provide a home page at `/` and an about page at `/about`, both reachable through navigation links in the header.

#### Scenario: Navigate to about
- **WHEN** the user activates the About link in the header
- **THEN** the application shows the about page at `/about` without a full page reload

#### Scenario: Unknown route
- **WHEN** the user visits a path that matches no page
- **THEN** a not-found page is displayed inside the main layout

### Requirement: Shared design system usage
The public template SHALL obtain its theme, typography and shared components from `@coto-dev/ui-kit` and MUST NOT define its own color palette.

#### Scenario: Theme from the ui-kit
- **WHEN** the application styles are built
- **THEN** the theme is applied through the ui-kit's styles entry point
- **AND** the application source defines no color palette of its own

### Requirement: Minimal tooling baseline
The public template SHALL include linting, formatting, unit testing with example specs, a pre-commit hook, a container definition with web server configuration, and one end-to-end test example.

#### Scenario: Example tests pass
- **WHEN** the unit test command and the end-to-end test command are run on a fresh project
- **THEN** all example tests pass

#### Scenario: Team policy tooling absent
- **WHEN** a project is generated from the public template
- **THEN** it contains no mutation testing, duplicate-code detection, Jira-ticket commit rules, CI pipeline file or service catalog file
