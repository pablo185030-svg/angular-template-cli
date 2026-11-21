# backoffice-template Specification

## Purpose

Provides a simple but functional starting point for a private backoffice web application, with Keycloak authentication, a main layout, example pages and a basic create-read-update-delete (ABM) example, styled with the shared Coto design system.

## Requirements

### Requirement: Buildable and runnable out of the box
The backoffice template SHALL install, build, run and pass its tests without any modification after generation, given access to the private registry, and SHALL NOT require a running Keycloak server to run its tests.

#### Scenario: Fresh project works
- **WHEN** a project is generated from the backoffice template and dependencies are installed
- **THEN** the build, the unit tests and the lint check complete successfully
- **AND** the development server serves the application

### Requirement: Folder scaffolding and layout
The backoffice template SHALL use the same `core/`, `shared/` and `domains/` organization and the same main layout (header, routed content, footer) as the public template, with kebab-case names. Its home description SHALL link to the Coto UI Kit repository.

#### Scenario: Same structure as public
- **WHEN** a project is generated from the backoffice template
- **THEN** it contains `core/`, `shared/` and `domains/` directories
- **AND** it provides a home page at `/` and an about page at `/acerca-de` inside a layout with header and footer

#### Scenario: Link to the ui-kit
- **WHEN** the user views the home page
- **THEN** the description names "Coto UI Kit" as a link to the ui-kit repository that opens in a new tab

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

### Requirement: Demo mode without Keycloak
The backoffice template SHALL start in demo mode in local development until Keycloak is configured: a fake signed-in user, every page reachable, and a visible indication that it is a demo. Production builds MUST NOT use demo mode.

#### Scenario: Visible without credentials
- **WHEN** a freshly generated backoffice is started without Keycloak configured
- **THEN** the layout and every page are displayed with a demo user
- **AND** the header shows a demo mode badge and no logout action

#### Scenario: Production uses Keycloak
- **WHEN** the application is built for production
- **THEN** authentication uses Keycloak and not the demo user

### Requirement: Keycloak configuration after generation
The backoffice template SHALL provide a command that asks for the Keycloak URL, realm and client id (or accepts them as flags), writes them to the environment files and switches local development from demo mode to Keycloak.

#### Scenario: Connect Keycloak later
- **WHEN** the user runs the configuration command with valid values
- **THEN** the environment files contain those values and local development authenticates against Keycloak

#### Scenario: Invalid values
- **WHEN** the user runs the command with an invalid URL, realm or client id
- **THEN** it exits with an error and leaves the environment files unchanged

### Requirement: Keycloak configuration per environment
The Keycloak server URL, realm and client identifier SHALL be configurable per environment without code changes beyond environment files.

#### Scenario: Environment-specific settings
- **WHEN** the application is built for a given environment
- **THEN** it uses the Keycloak settings defined for that environment

### Requirement: Simple CRUD example
The backoffice template SHALL include a products example (ABM) offering a list, a create form, an edit form and a delete action, backed by a mock API so it works without a real backend. The mock API SHALL be seeded with supermarket products (for example milk, bread, yerba mate and rice), each with a name, a price and a stock, and the UI SHALL label those fields in Spanish (Nombre, Precio, Stock).

#### Scenario: List products
- **WHEN** the user opens the products page
- **THEN** a table of supermarket products from the mock API is displayed with Spanish column headers
- **AND** prices are formatted with the `es-AR` locale

#### Scenario: Create product
- **WHEN** the user submits the create form with valid data
- **THEN** the product is saved and appears in the list

#### Scenario: Validation errors
- **WHEN** the user submits the form with a required field empty
- **THEN** the form shows a validation message in Spanish and does not send the request

#### Scenario: Edit product
- **WHEN** the user edits an existing product and saves
- **THEN** the list shows the updated values

#### Scenario: Delete product
- **WHEN** the user confirms deletion of a product in the Spanish confirm dialog
- **THEN** the product is removed from the list

### Requirement: README
The backoffice template SHALL include a README that explains what it is, how to start it, its stack, commands, environments, authentication (demo mode and how to connect Keycloak), the mock API, project structure and deployment.

#### Scenario: README present
- **WHEN** a project is generated from the backoffice template
- **THEN** it contains a README covering those topics

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

### Requirement: Spanish user-facing text
The backoffice template SHALL render all user-visible text in Spanish, including navigation, page titles and bodies, footer, not-found page, confirm dialog, form labels, buttons, validation messages, loading, empty and error states, accessible labels, the demo user name and the demo badge, and SHALL declare `lang="es"` on the document and use the `es-AR` locale for number and currency formatting. Code, identifiers, routes and `data-testid` values SHALL remain in English.

#### Scenario: Spanish layout and pages
- **WHEN** the user opens any page of the backoffice
- **THEN** the header, page content, footer and dialogs are displayed in Spanish

#### Scenario: Spanish demo mode
- **WHEN** the backoffice starts in demo mode
- **THEN** the badge and the demo user name are displayed in Spanish

#### Scenario: Spanish validation messages
- **WHEN** the user submits the product form with an invalid field
- **THEN** the validation message is displayed in Spanish

### Requirement: Selectable products data source
The backoffice template SHALL support two data sources for the products example, selected by an environment setting: the HTTP API (backed by the mock API server by default) and a JSON mode that loads sample products from a JSON file and applies create, update and delete in browser memory, losing changes on reload. The sample supermarket products SHALL come from a single JSON file shared by both modes.

#### Scenario: JSON mode works without a server
- **WHEN** the products data source is set to JSON and the app runs with no mock API server
- **THEN** the products list shows the sample supermarket products
- **AND** creating, editing and deleting a product updates the list until the page is reloaded

#### Scenario: Removing the mock API
- **WHEN** the project script that removes the mock API is run
- **THEN** the mock server, its npm script, the dev proxy and the e2e web server entry for it are removed and the data source is set to JSON
- **AND** the unit tests and the e2e tests still pass

### Requirement: Optional dark mode
The backoffice template SHALL read a theme setting from its environment. When dark mode is enabled, the header SHALL show a toggle that switches between light and dark themes and remembers the choice, and the app SHALL start in light mode. When it is disabled, the app SHALL always use the light theme and show no toggle.

#### Scenario: Toggle between themes
- **WHEN** dark mode is enabled and the user activates the header toggle
- **THEN** the app switches to the dark theme and a reload keeps it

#### Scenario: Light only
- **WHEN** dark mode is disabled
- **THEN** the header shows no toggle and the light theme is applied even if a dark choice was stored

### Requirement: Spanish product routes
The products example SHALL use Spanish routes: `/productos` for the list, `/productos/nuevo` for the create form and `/productos/:id/editar` for the edit form. The API path SHALL remain `/api/products`.

#### Scenario: Product routes
- **WHEN** the user opens the products list and chooses to create or edit a product
- **THEN** the address bar shows `/productos/nuevo` or `/productos/<id>/editar`

### Requirement: Animated theme toggle icons
When dark mode is enabled, the theme toggle SHALL be an icon button that shows a sun in the light theme and a moon in the dark theme, animating the change between them, and SHALL expose an accessible name describing the action. The animation SHALL be disabled for users who prefer reduced motion.

#### Scenario: Toggle animation
- **WHEN** the user activates the toggle
- **THEN** the sun icon animates into the moon icon, or the reverse, while the theme changes
