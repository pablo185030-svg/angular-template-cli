# Spec Delta

## MODIFIED Requirements

### Requirement: Demo mode without Keycloak
The backoffice template SHALL start in demo mode in local development until Keycloak is configured: a fake signed-in user, every page reachable, and a visible indication that it is a demo. In demo mode the app SHALL obtain a fake access token from the mock API when it is available, and SHALL fall back to a local fake token when it is not. Production builds MUST NOT use demo mode.

#### Scenario: Visible without credentials
- **WHEN** a freshly generated backoffice is started without Keycloak configured
- **THEN** the layout and every page are displayed with a demo user
- **AND** the header shows a demo mode badge and no logout action

#### Scenario: Token from the mock API
- **WHEN** the app starts in demo mode with the mock API running
- **THEN** the app requests a fake token from the mock API before the first navigation and keeps it in memory only
- **AND** the demo user name shown in the header comes from that token
- **AND** requests to the API carry the token in the Authorization header

#### Scenario: No mock API available
- **WHEN** the app starts in demo mode and the products data source is JSON, or the mock API does not answer the token request
- **THEN** the app starts with the local fake demo user and token
- **AND** every page is still reachable

#### Scenario: Production uses Keycloak
- **WHEN** the application is built for production
- **THEN** authentication uses Keycloak and not the demo user

## ADDED Requirements

### Requirement: Mock API requires the demo token
The mock API server SHALL expose a token endpoint under the API prefix that returns a fake, unsigned token carrying a user name, roles and an expiry, and SHALL answer `401` to products requests that carry no Authorization Bearer header. The health endpoint and the token endpoint MUST remain open.

#### Scenario: Token issued
- **WHEN** a client sends a POST request to the mock API token endpoint
- **THEN** the response contains a token whose claims include a user name, roles and an expiry

#### Scenario: Products without token
- **WHEN** a client requests `/api/products` without an Authorization Bearer header
- **THEN** the mock API responds with status 401 and a JSON message

#### Scenario: Products with token
- **WHEN** a client requests `/api/products` with an Authorization Bearer header
- **THEN** the mock API serves the products as before

#### Scenario: Open endpoints
- **WHEN** a client requests the health endpoint without a token
- **THEN** the mock API responds with status 200
