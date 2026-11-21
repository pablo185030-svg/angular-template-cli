## ADDED Requirements

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

## MODIFIED Requirements

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
