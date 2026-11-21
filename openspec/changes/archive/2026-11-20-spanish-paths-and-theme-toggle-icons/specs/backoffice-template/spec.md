## MODIFIED Requirements

### Requirement: Folder scaffolding and layout
The backoffice template SHALL use the same `core/`, `shared/` and `domains/` organization and the same main layout (header, routed content, footer) as the public template, with kebab-case names. Its home description SHALL link to the Coto UI Kit repository.

#### Scenario: Same structure as public
- **WHEN** a project is generated from the backoffice template
- **THEN** it contains `core/`, `shared/` and `domains/` directories
- **AND** it provides a home page at `/` and an about page at `/acerca-de` inside a layout with header and footer

#### Scenario: Link to the ui-kit
- **WHEN** the user views the home page
- **THEN** the description names "Coto UI Kit" as a link to the ui-kit repository that opens in a new tab

## ADDED Requirements

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
