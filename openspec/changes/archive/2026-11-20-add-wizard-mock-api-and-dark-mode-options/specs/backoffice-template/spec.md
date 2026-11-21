## ADDED Requirements

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
