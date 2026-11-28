# website-template Specification

## Purpose

Provides a simple but functional starting point for a public-facing website, server-side rendered and styled with the shared Coto design system, with a main layout and two example pages.

## Requirements

### Requirement: Buildable and runnable out of the box
The website template SHALL install, build, run and pass its tests without any modification after generation, given access to the private registry.

#### Scenario: Fresh project works
- **WHEN** a project is generated from the website template and dependencies are installed
- **THEN** the build, the unit tests and the lint check complete successfully
- **AND** the development server serves the home page

### Requirement: Server-side rendering
The website template SHALL render pages on the server and provide a production server entry point and container image definition.

#### Scenario: Server-rendered response
- **WHEN** the production server receives a request for the home page
- **THEN** the response HTML contains the rendered page content

### Requirement: Folder scaffolding
The website template SHALL organize application code into `core/` (app-wide singletons), `shared/` (reusable layouts and components) and `domains/` (one folder per feature area), with kebab-case folder and file names.

#### Scenario: Scaffolding present
- **WHEN** a project is generated from the website template
- **THEN** the application source contains `core/`, `shared/` and `domains/` directories
- **AND** `domains/` contains one folder each for the home and about pages

### Requirement: Main layout
The website template SHALL provide a main layout composed of a header, the routed page content and a footer, shared by all pages. The layout SHALL be responsive and mobile-first: no page SHALL scroll horizontally on a 320px wide viewport. From 768px wide up the header SHALL show the navigation links inline. Below 768px the header SHALL show an animated hamburger button that opens a drawer containing the navigation links and, when dark mode is enabled, the theme toggle.

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

### Requirement: Home and about pages
The website template SHALL provide a home page at `/` and an about page at `/acerca-de`, both reachable through navigation links in the header. The home description SHALL link to the Coto UI Kit repository.

#### Scenario: Navigate to about
- **WHEN** the user activates the About link in the header
- **THEN** the application shows the about page at `/acerca-de` without a full page reload

#### Scenario: Unknown route
- **WHEN** the user visits a path that matches no page
- **THEN** a not-found page is displayed inside the main layout

#### Scenario: Link to the ui-kit
- **WHEN** the user views the home page
- **THEN** the description names "Coto UI Kit" as a link to the ui-kit repository that opens in a new tab

### Requirement: README
The website template SHALL include a Spanish README (`README.md`, the default) and an English copy (`README.en.md`), each linking to the other, that explain what it is, how to start it, its stack, commands, environments, server-side rendering settings, project structure and deployment.

#### Scenario: README present
- **WHEN** a project is generated from the website template
- **THEN** it contains a README covering those topics

### Requirement: Shared design system usage
The website template SHALL obtain its theme, typography and shared components from `@coto-dev/ui-kit` and MUST NOT define its own color palette.

#### Scenario: Theme from the ui-kit
- **WHEN** the application styles are built
- **THEN** the theme is applied through the ui-kit's styles entry point
- **AND** the application source defines no color palette of its own

### Requirement: Minimal tooling baseline
The website template SHALL include linting, formatting, unit testing with example specs, a pre-commit hook, a container definition with web server configuration, and one end-to-end test example.

#### Scenario: Example tests pass
- **WHEN** the unit test command and the end-to-end test command are run on a fresh project
- **THEN** all example tests pass

#### Scenario: Team policy tooling absent
- **WHEN** a project is generated from the website template
- **THEN** it contains no mutation testing, duplicate-code detection, Jira-ticket commit rules, CI pipeline file or service catalog file

### Requirement: Spanish user-facing text
The website template SHALL render all user-visible text in Spanish, including navigation, page titles and bodies, the footer, the not-found page and accessible labels, and SHALL declare `lang="es"` on the document. Code, identifiers, routes and `data-testid` values SHALL remain in English.

#### Scenario: Spanish navigation and pages
- **WHEN** the user opens the home, about or an unknown page
- **THEN** the header links, headings, body text, footer and not-found page are displayed in Spanish

#### Scenario: Document language
- **WHEN** the application HTML is served
- **THEN** the `html` element has `lang="es"`

### Requirement: Optional dark mode
The website template SHALL read a theme setting from its environment. When dark mode is enabled, the header SHALL show a toggle that switches between light and dark themes and remembers the choice, and the site SHALL start in light mode. When it is disabled, the site SHALL always use the light theme and show no toggle. Server-side rendering SHALL keep working in both cases.

#### Scenario: Toggle between themes
- **WHEN** dark mode is enabled and the user activates the header toggle
- **THEN** the site switches to the dark theme and a reload keeps it

#### Scenario: Light only
- **WHEN** dark mode is disabled
- **THEN** the header shows no toggle and the light theme is applied

### Requirement: Animated theme toggle icons
When dark mode is enabled, the theme toggle SHALL be an icon button that shows a sun in the light theme and a moon in the dark theme, animating the change between them, and SHALL expose an accessible name describing the action. The animation SHALL be disabled for users who prefer reduced motion.

#### Scenario: Toggle animation
- **WHEN** the user activates the toggle
- **THEN** the sun icon animates into the moon icon, or the reverse, while the theme changes

### Requirement: Rendering mode script
The website template SHALL ship a `configure:rendering` script that converts the project from SSR to SSG or SPA, and SHALL itself remain server-side rendered. For SSG it SHALL configure static prerendering of every route and replace the container and web server definitions with a static one. For SPA it SHALL build a client-only app, remove the server entry point, server configuration and server-only dependencies, and replace the container and web server definitions with a static one that falls back to `index.html`. The script SHALL refuse to run on a project that is no longer SSR, and SHALL accept only `ssg` and `spa`.

#### Scenario: Convert to SSG
- **WHEN** `npm run configure:rendering -- --mode ssg` runs on the shipped template
- **THEN** the production build outputs prerendered HTML for each route and no Node server bundle
- **AND** the Dockerfile and nginx configuration serve the static output

#### Scenario: Convert to SPA
- **WHEN** `npm run configure:rendering -- --mode spa` runs on the shipped template
- **THEN** the production build succeeds without `@angular/ssr`, `src/server.ts` or `src/main.server.ts`
- **AND** the nginx configuration serves `index.html` for unknown paths

#### Scenario: Already converted
- **WHEN** the script runs on a project that is not SSR, or with another mode value
- **THEN** it exits with an error and changes nothing

#### Scenario: Default stays SSR
- **WHEN** a project is generated without choosing a mode
- **THEN** it is server-side rendered as before

### Requirement: App version display
The website template SHALL show the version declared in its `package.json` in the footer, and SHALL print a single styled banner in the browser console once after the first render, with the project name, the environment name, the version and the load time. The banner SHALL NOT be printed during server-side rendering.

#### Scenario: Version in the footer
- **WHEN** any page is displayed
- **THEN** the footer shows a single line "<year> COTO - <app name>. Versión <version>" with the `package.json` version

#### Scenario: Console banner
- **WHEN** the app finishes its first render in the browser
- **THEN** one console message is logged containing the project name, the environment name in upper case, the version and the load time
