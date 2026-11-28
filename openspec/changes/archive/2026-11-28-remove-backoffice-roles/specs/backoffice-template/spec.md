# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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

## REMOVED Requirements

### Requirement: Spanish user-facing text
**Reason**: Replaced by "Spanish interface text", which no longer mentions the roles screens and permission names.
**Migration**: None.

### Requirement: Mock API requires the demo token
**Reason**: Replaced by "Mock API requires a token", which drops the roles endpoint and permission checks.
**Migration**: None.
