## ADDED Requirements

### Requirement: Rendering mode script
The public template SHALL ship a `configure:rendering` script that converts the project from SSR to SSG or SPA, and SHALL itself remain server-side rendered. For SSG it SHALL configure static prerendering of every route and replace the container and web server definitions with a static one. For SPA it SHALL build a client-only app, remove the server entry point, server configuration and server-only dependencies, and replace the container and web server definitions with a static one that falls back to `index.html`. The script SHALL refuse to run on a project that is no longer SSR, and SHALL accept only `ssg` and `spa`.

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
