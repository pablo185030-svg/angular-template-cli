# Spec Delta

## MODIFIED Requirements

### Requirement: Optional Keycloak configuration
When the app type is backoffice, the CLI SHALL ask which environments the project has (`local` and `prod` always, plus any extra environments the user names) and SHALL offer to configure Keycloak (URL, realm and client id) for each of them. It SHALL write each environment's values into that environment's file in the generated project. The client id SHALL default to the project name, and every question after the first SHALL default to the previous environment's answer.

#### Scenario: Configure Keycloak in the wizard
- **WHEN** the user chooses backoffice, adds the environments `dev` and `qa`, and enters a different URL and realm for `local`, `dev`, `qa` and `prod`
- **THEN** the generated project has one environment file per environment, each containing its own Keycloak URL, realm and client id
- **AND** each of those environments can be built and served by its own configuration

#### Scenario: Skip Keycloak
- **WHEN** the user chooses backoffice and declines to configure Keycloak
- **THEN** the generated project starts in demo mode in local development
- **AND** the final summary explains how to connect Keycloak later, per environment

#### Scenario: Leave one environment unconfigured
- **WHEN** the user declines to configure Keycloak for a non-prod environment and configures the others
- **THEN** that environment's file keeps placeholder Keycloak values and the others contain their own values
- **AND** the final summary names the environments still to configure

#### Scenario: Keycloak flags without a terminal
- **WHEN** the CLI runs with `--environments dev,qa` and one `--keycloak <env>=<url>,<realm>` flag per environment and no terminal
- **THEN** no question is asked and each environment's values are written to the generated project

#### Scenario: Legacy single-environment flags
- **WHEN** the CLI runs with the Keycloak URL and realm flags and no environment flags
- **THEN** the same values are written to every environment of the project

#### Scenario: Keycloak with a public site
- **WHEN** Keycloak or environment flags are given together with the public website type
- **THEN** the CLI exits with a non-zero status and writes nothing

#### Scenario: Invalid Keycloak values
- **WHEN** the URL does not start with http:// or https://, or the realm or client id contains spaces
- **THEN** the CLI rejects the value, and in the guided flow lets the user correct it

#### Scenario: Invalid environment names
- **WHEN** an environment name is not lowercase kebab-case, repeats another, or is `e2e`
- **THEN** the CLI rejects it before writing any file, and in the guided flow lets the user correct it

## ADDED Requirements

### Requirement: Redirect URIs in the summary
For a backoffice with Keycloak configured, the final summary SHALL list the environments and say that each Keycloak client needs the application's URL for that environment as a valid redirect URI.

#### Scenario: Summary lists environments
- **WHEN** a backoffice with the environments `local`, `dev` and `prod` is generated
- **THEN** the summary names the three environments and the redirect URI to register for local development
