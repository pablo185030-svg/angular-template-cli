# Coto Angular templates

Two ready-to-run Angular 22 project templates for Coto apps, styled with `@coto-dev/ui-kit`, and a CLI wizard that generates a new project from either one.

| Template                  | What it is                                                                                   |
| ------------------------- | -------------------------------------------------------------------------------------------- |
| `templates/public`        | Public website. Server-side rendered, main layout (header + footer), home and about pages.   |
| `templates/backoffice`    | Private web app. SPA, Keycloak login, same layout and pages, plus a products CRUD example.   |

Both are zoneless, standalone-component apps with ESLint, Prettier, Vitest, Husky + lint-staged, a Dockerfile and nginx config, and Playwright e2e examples. Each template is a normal Angular project that builds and tests on its own.

## Requirements

- Node.js 24 (see `.nvmrc` in each template) and npm.
- Network access to the private Nexus registry that serves `@coto-dev/ui-kit`. Each template ships an `.npmrc` that points the `@coto-dev` scope to it; no credentials are needed.

## Create a project

This repository is not published: clone it and run the wizard from the clone.

```bash
git clone <this-repo-url> coto-angular-templates
cd coto-angular-templates
npm install --prefix cli     # once
npm run create               # guided wizard
```

The wizard asks for the app type and the project name, copies the template into `./<project-name>`, renames it, and starts a fresh git repository on `main`. Then:

```bash
cd <project-name>
npm install
npm start                    # backoffice: also run `npm run mock:api` in a second terminal
```

Without a terminal (CI, scripts), pass everything as flags:

```bash
npm run create -- --type backoffice --name my-admin --out ~/projects --yes
```

| Flag                          | Meaning                                                     |
| ----------------------------- | ----------------------------------------------------------- |
| `--type public\|backoffice`   | Kind of app                                                 |
| `--name <name>`               | Project name: lowercase letters, numbers and single hyphens |
| `--out <dir>`                 | Parent directory for the new project (default: current)     |
| `-y`, `--yes`                 | No prompts, plain text output (needs `--type` and `--name`) |
| `-h`, `--help`                | Show help                                                   |

The CLI refuses to write into a non-empty directory.

## Develop the templates

Install a template's dependencies with husky disabled, so it does not touch this repository's git config:

```bash
cd templates/backoffice
HUSKY=0 npm install
npm start
```

Verify everything (install, lint, unit tests, build and e2e for each template, plus the CLI tests):

```bash
npm run verify          # full
npm run verify:quick    # without Playwright
```

`node scripts/verify-templates.mjs --template public --only lint,test` runs a subset. The script exits non-zero when any step fails.

Each template has its own `CLAUDE.md` with its commands, structure and conventions. The template name `coto-angular-template` is the placeholder the CLI replaces, so keep using it in the templates' files.

## Repository layout

```
cli/            wizard (Node, ESM) and its tests
templates/
  public/       public website template
  backoffice/   backoffice template
scripts/        verify-templates.mjs
openspec/       specs and change proposals (this project is built with OpenSpec)
```
