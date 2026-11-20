# Design

## Context

See proposal.md for motivation. Three reference projects exist and are read-only inputs:

- `ms-digital-sitio-web-ui`: Angular 22.1.5 pinned without `^`, npm, zoneless, SSR, Signal Forms, Vitest, Playwright, mock API, Husky. Basis for the public template.
- Previous `template-angular`: Angular 21, yarn, Zone.js, Keycloak via `angular-oauth2-oidc`, a products CRUD, three generators and heavy docs. Source only for the Keycloak integration and the CRUD example.
- `coto-ui-kit`: Angular 22.1.5 library published as `@coto-dev/ui-kit` to a private Nexus registry; consumers call its `coto.theme()` mixin once.

This repository starts empty. It uses OpenSpec; see `CLAUDE.md`.

## Goals / Non-Goals

**Goals:**
- Each template is a real Angular project that builds and tests on its own, so it can be opened and verified without the CLI.
- The CLI stays small: copy a directory, replace placeholders, init git.
- The two templates share the same folder structure and conventions.

**Non-Goals:**
- A web-based wizard.
- Composing templates from optional layers or feature toggles.
- Shipping team policy tooling (mutation testing, Jira rules, Jenkinsfile).
- Migrating existing projects to the templates.

## Decisions

### CLI in Node.js, not a web wizard
A web wizard cannot write to disk (it can only offer a zip) and the user ends up in a terminal anyway to install and start. A single Node script runs on every OS and avoids the triple maintenance (`.sh`, `.ps1`, `.html`) of the previous generator.
Alternatives: web wizard (rejected: needs hosting, no file access); shell scripts per OS (rejected: duplicated logic).

### Two complete templates, not base plus layers
`templates/public/` and `templates/backoffice/` are each a full project. The CLI copies one folder. Duplication between them is limited to `angular.json`, tsconfig, lint and test config because the ui-kit already carries shared styling and components.
Alternative: base plus overlays merged by the CLI (rejected: requires merging `package.json`, `app.config.ts` and routes, which recreates the over-engineering we want to avoid, and no layer is buildable alone).

### Demo mode by default, Keycloak configured on demand
A backoffice that shows nothing until Keycloak credentials exist is a poor first experience. Local development therefore ships with `auth.mode: 'mock'` (a fake user and a "Demo mode" badge); production stays on `keycloak`; the e2e configuration is always `mock`. `AuthService` exposes `isDemo` so the header can show the badge and hide logout. The wizard asks (opt-in) for URL, realm and client id, and `npm run configure:keycloak` does the same later. Both go through one implementation, `scripts/configure-keycloak.mjs` inside the template: the CLI runs that script in the generated project instead of duplicating the logic. The script rewrites only the `keycloak` block of the dev and prod environment files and flips the dev mode.
Alternatives: wizard-only configuration (rejected: no way to add it later); requiring credentials up front (rejected: blocks seeing the app); defaulting to `keycloak` with placeholder values (rejected: blank page).

### Keycloak is part of the backoffice, not an option
A backoffice without authentication is not useful, so the wizard does not offer a toggle. Authentication goes through `angular-oauth2-oidc` as in the previous template. Settings (URL, realm, client id) live in environment files. Tests and the mock API must not need a live Keycloak: authentication is behind a small service that tests replace with a fake.

### CRUD example runs on a mock API
The products ABM talks to a local mock server (as in the public site's `mock/server.js`) so a new project works without a backend. The backoffice e2e test runs against the mock with the auth service faked, never against a real Keycloak.

### Angular 22, zoneless, npm, pinned versions
Match `coto-ui-kit` and the public site: all `@angular/*` packages at the same exact version without `^`, npm as package manager, no Zone.js, standalone components, signals, Signal Forms. This avoids the ERESOLVE problems documented in the public site's `CLAUDE.md`.

### Folder scaffolding
Both templates use:

```
src/app/
  core/       guards/ interceptors/ services/ models/
  shared/     layouts/main-layout/  components/header/ footer/
  domains/    home/pages/home-page/  about/pages/about-page/
  app.routes.ts   main layout with child routes '' and 'about', plus a wildcard not-found
```

The backoffice adds `core/auth/` and `domains/products/`. Empty directories get a `.gitkeep` only if they would otherwise not exist.

### Minimal tooling
Included: ESLint, Prettier, Vitest with example specs, Husky + lint-staged, Dockerfile + nginx.conf, mock API, one Playwright e2e. Excluded: Stryker, jscpd, sonarjs, convention-check scripts, Jira-based branch and commit rules, Jenkinsfile, catalog-info. Those are team policy and each project adds them if needed. Playwright is kept to one example because it is a heavy dependency but shows the pattern.

### Placeholder replacement
Both templates are named `coto-angular-template`, and that string is the placeholder. It is what appears in `package.json`, `angular.json`, `index.html` and the Dockerfile, so the templates stay valid projects on their own. The wizard asks the user for the real project name, the CLI walks the copied files, skips binary files, and replaces every occurrence. Verification: after copying, the CLI scans for leftover occurrences and fails if any remain.
Alternative: a synthetic token such as `__PROJECT_NAME__` (rejected: it would make the templates invalid projects that do not build in place).

### Template repository layout
```
cli/          Node script, its tests, package.json with a bin entry
templates/
  public/
  backoffice/
openspec/
CLAUDE.md
```

## Risks / Trade-offs

- [Templates drift apart over time] -> CI builds and tests both templates; shared conventions are written once in each template's `CLAUDE.md`.
- [`@coto-dev/ui-kit` is in a private registry, so a fresh project cannot install] -> Each template ships the `.npmrc` from `ms-digital-sitio-web-ui` (the `@coto-dev` scope pointing to the private Nexus, no credentials), and the CLI prints a note that the registry must be reachable from the user's network.
- [Pinned Angular versions go stale] -> Upgrade both templates and the ui-kit together; document this in each template.
- [Placeholder token appears legitimately in content] -> Use an unusual token and fail on leftovers instead of silently ignoring.
- [Keycloak integration depends on a server we cannot run in tests] -> Fake the auth service in unit and e2e tests; manual verification against a real realm is listed in the tasks.

### CLI distribution: run from a clone
The CLI is not published. Users clone this repository, run `npm install` in `cli/`, and run `npm run create` from the root (which calls `node cli/index.js`). Templates are read from the sibling `templates/` directory, so there is no packaging step and no registry publishing.
Alternative: publish to the Nexus registry and run with `npx` (rejected for now: adds a release process; can be added later without changing the generated output).

### Output location
New projects are created in the folder that contains this repository (a sibling), so a generated project is never nested inside the template repo and its own git repository. `--out` overrides it (relative paths resolve from the current directory). The summary prints `cd` relative to the current directory.

### READMEs
Each template ships a `README.md` modeled on the public website's README (badges, table of contents, quick start, stack, requirements, commands, environments, structure, path aliases, breakpoints, tests), shortened to what a template needs. It sits beside `CLAUDE.md`, which stays the guide for AI assistants; both must be kept in sync.

### Wizard language
All text the wizard shows to the user (prompts, step names, errors, help, summary) is in Spanish, by explicit decision. Code, comments, identifiers and flag names stay in English. Generated projects and their documentation remain in English.

### Wizard look and feel
The CLI uses `@clack/prompts` for guided prompts, selectable lists, spinners and cancel handling, and `picocolors` for color, plus a small ASCII banner. It is plain ESM JavaScript with no build step. When output is not a TTY or `--yes` is passed, it falls back to plain text.
Alternatives: Ink (React renderer used by Claude Code; closest look, but needs React, JSX and a build step for a small tool); Inquirer or Enquirer (less polished, no built-in spinners and framing); hand-written ANSI (rejected: unmaintainable).

## Open Questions

None.
