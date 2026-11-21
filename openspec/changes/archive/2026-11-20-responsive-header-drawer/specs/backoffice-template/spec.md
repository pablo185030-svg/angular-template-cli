## MODIFIED Requirements

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
