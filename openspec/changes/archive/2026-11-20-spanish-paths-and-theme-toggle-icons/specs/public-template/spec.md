## MODIFIED Requirements

### Requirement: Home and about pages
The public template SHALL provide a home page at `/` and an about page at `/acerca-de`, both reachable through navigation links in the header. The home description SHALL link to the Coto UI Kit repository.

#### Scenario: Navigate to about
- **WHEN** the user activates the About link in the header
- **THEN** the application shows the about page at `/acerca-de` without a full page reload

#### Scenario: Unknown route
- **WHEN** the user visits a path that matches no page
- **THEN** a not-found page is displayed inside the main layout

#### Scenario: Link to the ui-kit
- **WHEN** the user views the home page
- **THEN** the description names "Coto UI Kit" as a link to the ui-kit repository that opens in a new tab

## ADDED Requirements

### Requirement: Animated theme toggle icons
When dark mode is enabled, the theme toggle SHALL be an icon button that shows a sun in the light theme and a moon in the dark theme, animating the change between them, and SHALL expose an accessible name describing the action. The animation SHALL be disabled for users who prefer reduced motion.

#### Scenario: Toggle animation
- **WHEN** the user activates the toggle
- **THEN** the sun icon animates into the moon icon, or the reverse, while the theme changes
