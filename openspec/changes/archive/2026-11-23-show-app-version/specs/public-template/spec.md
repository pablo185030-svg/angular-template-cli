## ADDED Requirements

### Requirement: App version display
The public template SHALL show the version declared in its `package.json` in the footer, and SHALL print a single styled banner in the browser console once after the first render, with the project name, the environment name, the version and the load time. The banner SHALL NOT be printed during server-side rendering.

#### Scenario: Version in the footer
- **WHEN** any page is displayed
- **THEN** the footer shows the `package.json` version next to the copyright text

#### Scenario: Console banner
- **WHEN** the app finishes its first render in the browser
- **THEN** one console message is logged containing the project name, the environment name in upper case, the version and the load time
