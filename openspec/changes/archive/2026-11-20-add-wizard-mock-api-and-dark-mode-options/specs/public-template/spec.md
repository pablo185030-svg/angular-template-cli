## ADDED Requirements

### Requirement: Optional dark mode
The public template SHALL read a theme setting from its environment. When dark mode is enabled, the header SHALL show a toggle that switches between light and dark themes and remembers the choice, and the site SHALL start in light mode. When it is disabled, the site SHALL always use the light theme and show no toggle. Server-side rendering SHALL keep working in both cases.

#### Scenario: Toggle between themes
- **WHEN** dark mode is enabled and the user activates the header toggle
- **THEN** the site switches to the dark theme and a reload keeps it

#### Scenario: Light only
- **WHEN** dark mode is disabled
- **THEN** the header shows no toggle and the light theme is applied
