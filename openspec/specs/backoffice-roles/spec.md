# backoffice-roles Specification

## Purpose
Defines the roles and permissions model of the backoffice template: the seeded users and roles, how permissions are enforced in the app, and the roles ABM with its data source.

## Requirements

### Requirement: Seeded users and roles
The backoffice template SHALL ship seed data for the mock API and the JSON data source: three roles (`admin`, `escritura`, `lectura`) and three users, one per role. The `admin` user SHALL have username `admin`, password `1234`, an `@coto.com.ar` email, a first name, a last name and employee number `1234`. The `escritura` and `lectura` users SHALL use the same password. A user SHALL carry a username, password, email, first name, last name, employee number and one role.

#### Scenario: Admin user available on a fresh project
- **WHEN** a freshly generated backoffice is started
- **THEN** the user `admin` with password `1234` can sign in
- **AND** that user has an `@coto.com.ar` email, a first name, a last name and employee number `1234`

#### Scenario: Default roles
- **WHEN** the roles list is opened on a fresh project
- **THEN** it shows `admin`, `escritura` and `lectura`

### Requirement: Role permissions
A role SHALL have a unique name, a description and a set of permissions chosen from `read`, `write` and `manage-roles`. The default roles SHALL be: `admin` with all three permissions, `escritura` with `read` and `write`, and `lectura` with `read`. A signed-in user's permissions SHALL be those of the user's role.

#### Scenario: Read-only user
- **WHEN** a user with the `lectura` role is signed in
- **THEN** the user has only the `read` permission

#### Scenario: Write user
- **WHEN** a user with the `escritura` role is signed in
- **THEN** the user has the `read` and `write` permissions

### Requirement: Permission enforcement in the app
The backoffice template SHALL restrict routes and actions by permission. Viewing products requires `read`; creating, editing and deleting products requires `write`; the roles screens require `manage-roles`. Actions the user may not perform SHALL be hidden, and a route the user may not open SHALL redirect to the home page.

#### Scenario: Read-only products
- **WHEN** a signed-in user without `write` opens the products list
- **THEN** the list is shown without the new, edit and delete actions

#### Scenario: Write route blocked
- **WHEN** a signed-in user without `write` opens `/productos/nuevo` directly
- **THEN** the user is redirected to the home page

#### Scenario: Roles navigation
- **WHEN** a signed-in user without `manage-roles` views the header
- **THEN** the navigation shows no link to the roles screen
- **AND** opening `/roles` directly redirects to the home page

### Requirement: Roles ABM
The backoffice template SHALL include a roles ABM for users with `manage-roles`: a list at `/roles`, a create form at `/roles/nuevo` and an edit form at `/roles/:id/editar`, plus a delete action with a confirm dialog. The form SHALL ask for the name, a description and the permissions, and SHALL show Spanish validation messages (name required and unique, at least `read` selected). The `admin` role SHALL NOT be deletable and its name and permissions SHALL NOT be editable. A role assigned to a user SHALL NOT be deletable.

#### Scenario: List roles
- **WHEN** an admin opens `/roles`
- **THEN** the roles are listed with their name, description and permissions

#### Scenario: Create role
- **WHEN** an admin submits the create form with a unique name and valid permissions
- **THEN** the role is saved and appears in the list

#### Scenario: Duplicate name
- **WHEN** an admin submits a role with a name that already exists
- **THEN** the form shows a validation message in Spanish and the role is not created

#### Scenario: Edit role
- **WHEN** an admin edits a role other than `admin` and saves
- **THEN** the list shows the updated values

#### Scenario: Delete role
- **WHEN** an admin confirms deletion of an unused role other than `admin`
- **THEN** the role is removed from the list

#### Scenario: Protected and used roles
- **WHEN** an admin looks at the `admin` role, or at a role assigned to a user
- **THEN** the delete action is not offered for it
- **AND** the `admin` role's name and permissions are shown read-only

### Requirement: Roles data source
The roles data SHALL follow the same data source setting as products: with the HTTP source the roles are served by the mock API (`/api/roles`) and changes live in its memory; with the JSON source they are loaded from a JSON file shared with the mock API and changes live in browser memory.

#### Scenario: Roles with the JSON source
- **WHEN** the data source is JSON and no mock API runs
- **THEN** the roles list shows the seeded roles
- **AND** creating, editing and deleting a role updates the list until the page is reloaded
