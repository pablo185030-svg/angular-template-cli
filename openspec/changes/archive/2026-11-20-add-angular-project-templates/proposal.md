# Proposal

## Why

Teams building Angular apps at Coto start every project by copying and adapting an existing one. The public website (`ms-digital-sitio-web-ui`) carries a lot of project-specific code, and the previous `template-angular` was backoffice-only and over-engineered (three generators, demo pages, large docs, its own palette system, Angular 21 with Zone.js). We want a simple but functional starting point for both kinds of apps, built on the shared `@coto-dev/ui-kit` design system.

## What Changes

- Add two complete, buildable Angular templates in this repo:
  - `templates/public/`: public website (SSR), based on `ms-digital-sitio-web-ui`.
  - `templates/backoffice/`: private web app (SPA) with Keycloak authentication and a simple CRUD (ABM) example.
- Both templates use Angular 22 (zoneless, standalone, signals), npm, and `@coto-dev/ui-kit`.
- Both templates ship the same folder scaffolding (`core/`, `shared/`, `domains/`), a main layout with header and footer, a `home` page and an `about` page.
- Add a Node.js CLI wizard (`cli/`), run from a clone of this repository, with a polished terminal experience (banner, guided prompts, spinners, styled summary). It asks the user for the app type and project name, copies the matching template into a new directory, and replaces placeholders.
- Include a minimal tooling baseline in each template: ESLint, Prettier, Vitest with example specs, Husky + lint-staged, Dockerfile + nginx.conf, a mock API, and one Playwright e2e example.
- Explicitly leave out team-specific policy tooling: Stryker, jscpd, sonarjs, convention-check scripts, Jira-ticket branch/commit rules, Jenkinsfile, catalog-info.

## Capabilities

### New Capabilities
- `cli-wizard`: Node.js CLI that interactively (or via flags) generates a new project from a template.
- `public-template`: Public website template with SSR, layout, home and about pages.
- `backoffice-template`: Backoffice template with Keycloak authentication, layout, home and about pages, and a CRUD example.

### Modified Capabilities
<!-- None: the project has no existing specs. -->

## Impact

- New directories: `templates/public/`, `templates/backoffice/`, `cli/`.
- Dependencies: generated projects depend on `@coto-dev/ui-kit` from the private Nexus registry. Each template ships an `.npmrc` (taken from `ms-digital-sitio-web-ui`) that points the `@coto-dev` scope to that registry; it contains no credentials, so the registry must be reachable from the user's network.
- Naming: both templates use the fixed name `coto-angular-template` as their placeholder. The wizard asks the user for the real project name and replaces it.
- The backoffice template depends on a Keycloak server for real authentication; the CRUD example must work against a mock API.
- Reference sources (read-only, not modified): `ms-digital-sitio-web-ui`, the previous `template-angular`, and `coto-ui-kit`.
