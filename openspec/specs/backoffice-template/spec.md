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
The backoffice template SHALL use the same `core/`, `shared/` and `domains/` organization and the same main layout (header, routed content, footer) as the public template, with kebab-case names. Its home description SHALL link to the Coto UI Kit repository. The layout SHALL be responsive and mobile-first with the same header behavior as the public template: inline navigation from 768px wide up, and below 768px an animated hamburger button that opens a drawer. In the backoffice the drawer SHALL also contain the user area (theme toggle when dark mode is enabled, demo badge in demo mode, user name and logout button), which is shown inline in the header from 768px up. No page, including the products list and the product form, SHALL scroll the page horizontally on a 320px wide viewport.

#### Scenario: Same structure as public
- **WHEN** a project is generated from the backoffice template
- **THEN** it contains `core/`, `shared/` and `domains/` directories
- **AND** it provides a home page at `/` and an about page at `/acerca-de` inside a layout with header and footer

#### Scenario: Link to the ui-kit
- **WHEN** the user views the home page
- **THEN** the description names "Coto UI Kit" as a link to the ui-kit repository that opens in a new tab

#### Scenario: User area in the drawer
- **WHEN** the viewport is narrower than 768px and the user opens the drawer
- **THEN** the drawer shows the navigation links, the user name and the logout button (or the demo badge in demo mode), and the theme toggle when dark mode is enabled
- **AND** the header itself shows only the logo and the hamburger button

#### Scenario: Logout from the drawer
- **WHEN** the user activates the logout button inside the drawer
- **THEN** the session ends as it does from the desktop header

#### Scenario: Products list on mobile
- **WHEN** the user opens the products list on a viewport narrower than 768px
- **THEN** each product is shown as a card with its name, labelled price and stock, and its edit and delete actions
- **AND** the page does not scroll horizontally

#### Scenario: Products list on wider screens
- **WHEN** the user opens the products list on a viewport 768px wide or more
- **THEN** the products are shown as a table

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
The backoffice template SHALL start in demo mode in local development until Keycloak is configured. Demo mode SHALL NOT sign anyone in automatically: unauthenticated users SHALL be redirected to a Spanish login screen at `/login` (outside the main layout) and SHALL sign in with a username and password checked against the seeded users. The access token SHALL be obtained from the mock API login endpoint when the mock API is the data source, validated against the seeded users in the browser otherwise, and kept in memory only. The login screen SHALL list the seeded test users and their passwords, marked as for local environments only. The header SHALL indicate demo mode, show the signed-in user's name (with an initials avatar), and offer logout. Production builds MUST NOT use demo mode.

#### Scenario: Login required
- **WHEN** an unauthenticated user opens any application route in demo mode
- **THEN** the user is redirected to `/login`
- **AND** the login screen shows no header or navigation

#### Scenario: Successful login
- **WHEN** the user submits valid credentials
- **THEN** the user is sent to the route originally requested (or the home page)
- **AND** the header shows the user's name, a demo mode badge and a logout button

#### Scenario: Test users shown
- **WHEN** the login screen is displayed in demo mode
- **THEN** it lists the `admin` user with its password
- **AND** it states they are for local environments only

#### Scenario: Invalid credentials
- **WHEN** the user submits a wrong username or password
- **THEN** the login screen shows a Spanish error message and the user stays signed out

#### Scenario: Visible without credentials
- **WHEN** a freshly generated backoffice is started in demo mode and the user signs in with the seeded `admin` user
- **THEN** the layout and every page are displayed
- **AND** the header shows a demo mode badge

#### Scenario: Token from the mock API
- **WHEN** the user signs in in demo mode with the mock API running
- **THEN** the app requests the token from the mock API login endpoint and keeps it in memory only
- **AND** the user name shown in the header comes from that token
- **AND** requests to the API carry the token in the Authorization header

#### Scenario: No mock API available
- **WHEN** the products data source is JSON, or the mock API does not answer
- **THEN** the credentials are checked against the seeded users in the browser and a local fake token is used
- **AND** every page is reachable

#### Scenario: Required fields
- **WHEN** the user submits the login form with an empty username or password
- **THEN** the form shows a Spanish validation message and sends no request

#### Scenario: Logout
- **WHEN** the signed-in user activates the logout button
- **THEN** the in-memory session is discarded and the user is sent to `/login`

#### Scenario: Reload
- **WHEN** the signed-in user reloads the page in demo mode
- **THEN** the user is sent back to `/login`

#### Scenario: Signed-in user on the login route
- **WHEN** a signed-in user opens `/login`
- **THEN** the user is redirected to the home page

#### Scenario: Production uses Keycloak
- **WHEN** the application is built for production
- **THEN** authentication uses Keycloak, whose own login replaces the login screen, and not the demo mode

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
The backoffice template SHALL include a Spanish README (`README.md`, the default) and an English copy (`README.en.md`), each linking to the other, that explain what it is, how to start it, its stack, commands, environments, authentication (demo mode and how to connect Keycloak), the mock API, project structure and deployment.

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

### Requirement: App version display
The backoffice template SHALL show the version declared in its `package.json` in the footer, and SHALL print a single styled banner in the browser console once after the first render, with the project name, the environment name, the version and the load time. The banner SHALL NOT be printed during server-side rendering.

#### Scenario: Version in the footer
- **WHEN** any page is displayed
- **THEN** the footer shows a single line "<year> COTO - <app name>. Versión <version>" with the `package.json` version

#### Scenario: Console banner
- **WHEN** the app finishes its first render in the browser
- **THEN** one console message is logged containing the project name, the environment name in upper case, the version and the load time

### Requirement: Spanish interface text
The backoffice template SHALL render all user-visible text in Spanish, including navigation, page titles and bodies, footer, not-found page, confirm dialog, form labels, buttons, validation messages, loading, empty and error states, accessible labels, the login screen, and the demo badge, and SHALL declare `lang="es"` on the document and use the `es-AR` locale for number and currency formatting. Code, identifiers, routes (other than the Spanish product routes and `/login`) and `data-testid` values SHALL remain in English.

#### Scenario: Spanish layout and pages
- **WHEN** the user opens any page of the backoffice
- **THEN** the header, page content, footer and dialogs are displayed in Spanish

#### Scenario: Spanish login
- **WHEN** the user opens the login screen
- **THEN** its labels, buttons and errors are displayed in Spanish

#### Scenario: Spanish demo mode
- **WHEN** the backoffice starts in demo mode
- **THEN** the login screen, the badge and the signed-in user name are displayed in Spanish

#### Scenario: Spanish validation messages
- **WHEN** the user submits the product form with an invalid field
- **THEN** the validation message is displayed in Spanish

### Requirement: Mock API requires a token
The mock API server SHALL expose a login endpoint under the API prefix (`POST /api/auth/login`) that checks a username and password against the seeded users and returns a fake, unsigned token carrying the user's name and an expiry, or `401` with a JSON message for wrong credentials. It SHALL answer `401` to `/api/products` requests that carry no Authorization Bearer header, and SHALL NOT check roles or permissions. It SHALL NOT expose a roles endpoint. The health endpoint and the login endpoint MUST remain open.

#### Scenario: Token issued
- **WHEN** a client sends valid credentials to the login endpoint
- **THEN** the response contains a token whose claims include the user name and an expiry

#### Scenario: Wrong credentials
- **WHEN** a client sends invalid credentials to the login endpoint
- **THEN** the mock API responds with status 401 and a JSON message

#### Scenario: Products without token
- **WHEN** a client requests `/api/products` without an Authorization Bearer header
- **THEN** the mock API responds with status 401 and a JSON message

#### Scenario: No roles endpoint
- **WHEN** a client requests `/api/roles`
- **THEN** the mock API responds with status 404

#### Scenario: Products with token
- **WHEN** a client requests `/api/products` with a token
- **THEN** the mock API serves the products as before

#### Scenario: Open endpoints
- **WHEN** a client requests the health endpoint without a token
- **THEN** the mock API responds with status 200
