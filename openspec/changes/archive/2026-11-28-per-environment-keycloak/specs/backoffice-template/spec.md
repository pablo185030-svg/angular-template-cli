# Spec Delta

## MODIFIED Requirements

### Requirement: Keycloak configuration after generation
The backoffice template SHALL provide a command that asks for the Keycloak URL, realm and client id of each environment (or accepts them as flags for one named environment), writes them to that environment's file and, for local development, switches from demo mode to Keycloak.

#### Scenario: Connect Keycloak later
- **WHEN** the user runs the configuration command for the `local` environment with valid values
- **THEN** the local environment file contains those values and local development authenticates against Keycloak

#### Scenario: Configure one environment
- **WHEN** the user runs the configuration command for the `qa` environment with valid values
- **THEN** only the `qa` environment file changes

#### Scenario: Invalid values
- **WHEN** the user runs the command with an invalid URL, realm, client id or an unknown environment
- **THEN** it exits with an error and leaves the environment files unchanged

### Requirement: Keycloak configuration per environment
Each environment SHALL define its own complete Keycloak client configuration (issuer, client id, redirect URIs, response type, scope, HTTPS requirement and token timing) in its environment file, so that changing an environment's Keycloak requires no code changes beyond that file.

#### Scenario: Environment-specific settings
- **WHEN** the application is built for a given environment
- **THEN** it uses the Keycloak settings defined for that environment and no other

#### Scenario: Extra environment builds
- **WHEN** a project has a `qa` environment
- **THEN** it can be built and served with the `qa` configuration, using `qa`'s settings

## ADDED Requirements

### Requirement: Session end handling
The backoffice template SHALL end the user's session when the identity provider reports that the session is over (logout, terminated session, failed token refresh or failed silent refresh), clearing the local session. Logging out MUST revoke the token at Keycloak, except in demo mode.

#### Scenario: Refresh fails
- **WHEN** the automatic token refresh fails
- **THEN** the local session is cleared and the token is revoked at Keycloak

#### Scenario: Token about to expire
- **WHEN** the token is close to expiring and a refresh is attempted
- **THEN** the user stays signed in

#### Scenario: Logout in demo mode
- **WHEN** the user logs out in demo mode
- **THEN** the local session is cleared and no Keycloak call is made

### Requirement: Roles readable from the token
The backoffice template SHALL expose the decoded access token payload and the roles granted to the environment's client id (`resource_access[<clientId>].roles`), returning an empty list when the token is absent, malformed or has none. The template MUST NOT use roles to restrict pages or actions.

#### Scenario: Roles present
- **WHEN** the access token grants roles to the configured client id
- **THEN** those roles are returned

#### Scenario: Malformed or missing token
- **WHEN** there is no token or it cannot be decoded
- **THEN** the payload is null and the roles list is empty
