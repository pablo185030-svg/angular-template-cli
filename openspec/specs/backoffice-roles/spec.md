# backoffice-roles Specification

## Purpose
Defines the roles and permissions model of the backoffice template: the seeded users and roles, how permissions are enforced in the app, and the roles ABM with its data source.

## Requirements

### Requirement: Seeded admin user
The backoffice template SHALL ship seed data for the mock API and the JSON data source with a single user: `admin`, password `1234`, an `@coto.com.ar` email, a first name, a last name and employee number `1234`. A user SHALL carry a username, password, email, first name, last name and employee number. The template SHALL NOT seed roles or any other user.

#### Scenario: Admin user available on a fresh project
- **WHEN** a freshly generated backoffice is started
- **THEN** the user `admin` with password `1234` can sign in
- **AND** that user has an `@coto.com.ar` email, a first name, a last name and employee number `1234`

#### Scenario: No other seeded users
- **WHEN** the seed data of a freshly generated backoffice is inspected
- **THEN** it contains only the `admin` user and no roles

### Requirement: Roles are managed outside the app
The backoffice template SHALL NOT define, manage or enforce roles or permissions. It SHALL NOT include a roles ABM, a role or permission model, route guards or UI restrictions based on them, or a roles API in the mock server. Roles are managed in Keycloak, and authorization of data belongs to the real API.

#### Scenario: Roles screens absent
- **WHEN** a signed-in user opens `/roles`
- **THEN** the not-found page is shown
- **AND** the header navigation shows no link to a roles screen

#### Scenario: Every signed-in user can use the products ABM
- **WHEN** any signed-in user opens the products list
- **THEN** the list offers the new, edit and delete actions
- **AND** the routes `/productos/nuevo` and `/productos/:id/editar` open for that user
