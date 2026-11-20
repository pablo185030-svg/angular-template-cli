# Tasks

## 1. Public template: project base

- [x] 1.1 Create `templates/public/` from `ms-digital-sitio-web-ui` keeping only config, SSR entry points, tooling baseline and styles setup (no business domains); verify `npm ci` and `npm run build` succeed
- [x] 1.2 Rename the project to `coto-angular-template` in `package.json`, `angular.json`, `index.html` and the Dockerfile; verify a text search finds the name only where intended
- [x] 1.3 Remove team policy tooling (Stryker, Jenkinsfile, catalog-info, Jira commit rules) and copy the `.npmrc` from `ms-digital-sitio-web-ui` (`@coto-dev` scope pointing to the private Nexus, no credentials); verify none of those policy files remain and `npm ci` resolves the ui-kit
- [x] 1.4 Apply the ui-kit theme through its styles entry point and verify no local color palette exists in `src/`

## 2. Public template: scaffolding, layout and pages

- [x] 2.1 Create `core/`, `shared/`, `domains/` scaffolding with kebab-case names; verify the directories exist
- [x] 2.2 Implement `shared/layouts/main-layout` with `header` and `footer` components and a unit spec for each; verify the specs pass
- [x] 2.3 Implement `domains/home` and `domains/about` pages and routes, plus a not-found route inside the layout; verify route specs cover `/`, `/about` and an unknown path
- [x] 2.4 Add header navigation links to Home and About; verify with a unit spec that navigation works
- [x] 2.5 Add one Playwright e2e that visits home, navigates to about and checks header and footer; verify it passes against the built app
- [x] 2.6 Write the template's `CLAUDE.md` (conventions, commands, folder structure) and verify it matches the actual scripts and layout

## 3. Backoffice template: project base

- [x] 3.1 Create `templates/backoffice/` as an Angular 22 zoneless SPA reusing the public template's config, tooling and ui-kit theme setup, without SSR; verify `npm ci` and `npm run build` succeed
- [x] 3.2 Reuse the same scaffolding, main layout, home and about pages and not-found route; verify the unit specs pass
- [x] 3.3 Confirm no charting or guided-tour dependency and no demo pages are present; verify by inspecting `package.json` and `src/`

## 4. Backoffice template: Keycloak authentication

- [x] 4.1 Add `core/auth` with an auth service wrapping `angular-oauth2-oidc`, configured from environment files (URL, realm, client id); verify unit specs with a fake OAuth client
- [x] 4.2 Add an auth guard that redirects unauthenticated users to login and returns them to the requested route; verify with specs for both states
- [x] 4.3 Add an interceptor that attaches the access token only to the configured API base URL; verify specs for matching and non-matching origins
- [x] 4.4 Show the signed-in user's name and a logout action in the header; verify with a header spec
- [ ] 4.5 Document the Keycloak settings and a local realm setup in the template's `CLAUDE.md` or README; verify the documented steps against a real Keycloak realm (manual)

## 5. Backoffice template: products CRUD example

- [x] 5.1 Add a mock API server with a products endpoint and an npm script to run it; verify `GET`, `POST`, `PUT` and `DELETE` with a quick request
- [x] 5.2 Implement `domains/products` service and model (types in `models/`); verify service specs with an HTTP testing backend
- [x] 5.3 Implement the products list page with a table; verify a component spec renders mock data and an empty state
- [x] 5.4 Implement the create and edit form with Signal Forms and required-field validation; verify specs for valid submit and validation errors
- [x] 5.5 Implement delete with a confirmation step; verify a spec that cancelling keeps the product and confirming removes it
- [x] 5.6 Add one Playwright e2e covering list, create, edit and delete against the mock API with the auth service faked; verify it passes without a Keycloak server

## 6. CLI wizard

- [x] 6.1 Create `cli/` (ESM, `@clack/prompts`, `picocolors`) with an entry point supporting flags `--type`, `--name` and `--yes`, and a root `npm run create` script; verify `npm run create -- --help` prints usage
- [x] 6.2 Implement the guided flow: banner, app type selection, project name prompt with inline validation, and Ctrl+C cancellation; verify with tests that simulate prompt input, invalid names and cancel (nothing written)
- [x] 6.2b Add a plain-text fallback for non-TTY and `--yes` runs; verify a test that captures output contains no ANSI codes or animation
- [x] 6.3 Implement name validation and the non-empty target directory check before writing; verify tests for invalid names and an existing directory leave the filesystem untouched
- [x] 6.4 Implement template copy that excludes `node_modules`, `dist`, `.git` and `.angular`, and placeholder replacement that skips binary files and fails on leftover tokens; verify tests on a fixture template
- [x] 6.5 Initialize a fresh git repository on `main` in the generated project; verify the generated project has no history from this repository
- [x] 6.4b Show a spinner per generation step (copy, rename, git init) with success or failure state; verify a test that a failing step reports an error and exits non-zero
- [x] 6.6 Print a styled summary with next steps and the note that `@coto-dev/ui-kit` comes from the private registry in the generated `.npmrc`; verify the output in a test
- [x] 6.7 Run the CLI on Windows path semantics (path joins, separators) using Node's `path` APIs only; verify via a test that does not hardcode `/`

## 7. Integration and documentation

- [x] 7.1 Generate a project of each type with the CLI into a temp directory, then run install, build, unit tests and e2e on each; verify all pass and no `coto-angular-template` text remains in the generated project
- [x] 7.2 Add a root `README.md` explaining the repository, how to run the CLI, and how to develop and verify the templates; verify the documented commands run as written
- [x] 7.3 Update the root `CLAUDE.md` to reference the `/openspec-*` skills and the repository layout; verify it matches the final structure
- [x] 7.4 Add a CI-friendly root script that builds and tests both templates; verify it exits non-zero when a template fails

## 8. Follow-up: READMEs, sibling output, Keycloak options and demo mode

- [x] 8.1 Add a README to each template modeled on the website README; verify the documented commands exist in `package.json` and the README is formatted by Prettier
- [x] 8.2 Create projects next to the repository by default (`--out` overrides); verify the default output directory is the parent of the repo and a test shows nothing is created inside it
- [x] 8.3 Ship the backoffice in demo mode (fake user, badge, no logout) with production on Keycloak and `isDemo` on the auth contract; verify unit specs and that the e2e shows the demo badge
- [x] 8.4 Add `scripts/configure-keycloak.mjs` and `npm run configure:keycloak` to the backoffice; verify tests for valid values, invalid values leaving files untouched, idempotence and the e2e file staying on the mock
- [x] 8.5 Ask for Keycloak in the wizard (confirm + URL, realm, client id) and via `--keycloak-*` flags, running the template's script; verify tests for prompts, flags, validation, cancel, public-site rejection and the summary text
- [x] 8.6 Translate the wizard text to Spanish; verify the help and summary in a real terminal and that the CLI tests pass

## Workflow follow-up

- Archive the change after review and verify the specs under `openspec/specs/`.
