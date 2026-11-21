## MODIFIED Requirements

### Requirement: Main layout
The public template SHALL provide a main layout composed of a header, the routed page content and a footer, shared by all pages. The layout SHALL be responsive and mobile-first: no page SHALL scroll horizontally on a 320px wide viewport. From 768px wide up the header SHALL show the navigation links inline. Below 768px the header SHALL show an animated hamburger button that opens a drawer containing the navigation links and, when dark mode is enabled, the theme toggle.

#### Scenario: Layout on every page
- **WHEN** the user visits any page of the application
- **THEN** the header and the footer are displayed around the page content

#### Scenario: Desktop header
- **WHEN** the viewport is 768px wide or more
- **THEN** the navigation links are shown inline in the header and no hamburger button is shown

#### Scenario: Open the drawer on mobile
- **WHEN** the viewport is narrower than 768px and the user activates the hamburger button
- **THEN** a drawer slides in over a dimmed backdrop showing the navigation links
- **AND** the hamburger icon animates into a close icon and the button reports the drawer as expanded
- **AND** the button exposes an accessible name describing the action in Spanish

#### Scenario: Close the drawer
- **WHEN** the drawer is open and the user presses Escape, clicks the backdrop, activates a navigation link or the close button
- **THEN** the drawer closes and focus returns to the hamburger button

#### Scenario: Viewport grows while open
- **WHEN** the drawer is open and the viewport becomes 768px wide or more
- **THEN** the drawer is closed and the inline navigation is shown

#### Scenario: Reduced motion
- **WHEN** the user prefers reduced motion
- **THEN** the drawer and the hamburger icon change state without animation
