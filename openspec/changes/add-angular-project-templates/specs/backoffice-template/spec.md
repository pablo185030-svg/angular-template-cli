# Spec Delta

## Purpose

Provides a simple but functional starting point for a private backoffice web application, with Keycloak authentication, a main layout, example pages and a basic create-read-update-delete (ABM) example, styled with the shared Coto design system.

## ADDED Requirements

### Requirement: Buildable and runnable out of the box
The backoffice template SHALL install, build, run and pass its tests without any modification after generation, given access to the private registry, and SHALL NOT require a running Keycloak server to run its tests.

#### Scenario: Fresh project works
- **WHEN** a project is generated from the backoffice template and dependencies are installed
- **THEN** the build, the unit tests and the lint check complete successfully
- **AND** the development server serves the application

### Requirement: Folder scaffolding and layout
The backoffice template SHALL use the same `core/`, `shared/` and `domains/` organization and the same main layout (header, routed content, footer) as the public template, with kebab-case names.

#### Scenario: Same structure as public
- **WHEN** a project is generated from the backoffice template
- **THEN** it contains `core/`, `shared/` and `domains/` directories
- **AND** it provides a home page at `/` and an about page at `/about` inside a layout with header and footer

### Requirement: Keycloak authentication
The backoffice template SHALL authenticate users against a Keycloak server configured per environment, and SHALL redirect unauthenticated users to the Keycloak login before showing any private page.

#### Scenario: Unauthenticated access
- **WHEN** an unauthenticated user opens any application route
- **THEN** the user is redirected to the Keycloak login

#### Scenario: Successful login
- **WHEN** the user completes the Keycloak login
- **THEN** the user returns to the originally requested route
- **AND** the header shows the signed-in user's name

#### Scenario: Logout
- **WHEN** the signed-in user activates the logout action in the header
- **THEN** the session ends and the user is sent to the Keycloak logout

### Requirement: Authenticated API calls
The backoffice template SHALL attach the user's access token to requests sent to the configured API base URL and MUST NOT attach it to requests to other origins.

#### Scenario: Token on API request
- **WHEN** the application calls the configured API base URL while signed in
- **THEN** the request carries the access token in the Authorization header

#### Scenario: No token on foreign origin
- **WHEN** the application calls a URL outside the configured API base URL
- **THEN** the request carries no Authorization header

### Requirement: Keycloak configuration per environment
The Keycloak server URL, realm and client identifier SHALL be configurable per environment without code changes beyond environment files.

#### Scenario: Environment-specific settings
- **WHEN** the application is built for a given environment
- **THEN** it uses the Keycloak settings defined for that environment

### Requirement: Simple CRUD example
The backoffice template SHALL include a products example offering a list, a create form, an edit form and a delete action, backed by a mock API so it works without a real backend.

#### Scenario: List products
- **WHEN** the user opens the products page
- **THEN** a table of products from the mock API is displayed

#### Scenario: Create product
- **WHEN** the user submits the create form with valid data
- **THEN** the product is saved and appears in the list

#### Scenario: Validation errors
- **WHEN** the user submits the form with a required field empty
- **THEN** the form shows a validation message and does not send the request

#### Scenario: Edit product
- **WHEN** the user edits an existing product and saves
- **THEN** the list shows the updated values

#### Scenario: Delete product
- **WHEN** the user confirms deletion of a product
- **THEN** the product is removed from the list

### Requirement: Shared design system usage
The backoffice template SHALL obtain its theme, typography and shared components from `@coto-dev/ui-kit` and MUST NOT define its own color palette.

#### Scenario: Theme from the ui-kit
- **WHEN** the application styles are built
- **THEN** the theme is applied through the ui-kit's styles entry point
- **AND** the application source defines no color palette of its own

### Requirement: Minimal tooling baseline
The backoffice template SHALL include the same minimal tooling baseline as the public template and MUST NOT include charting libraries, guided-tour libraries or demo pages.

#### Scenario: Example tests pass without Keycloak
- **WHEN** the unit and end-to-end test commands are run on a fresh project with no Keycloak server available
- **THEN** all example tests pass

#### Scenario: No demo extras
- **WHEN** a project is generated from the backoffice template
- **THEN** its dependencies include no charting or guided-tour library
- **AND** it contains no demo or documentation pages
