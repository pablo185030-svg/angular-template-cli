# angular-template-cli

![Angular](https://img.shields.io/badge/Angular-22-DD0031?style=flat&logo=angular) ![Node](https://img.shields.io/badge/Node-24-339933?style=flat&logo=node.js)

> 🌐 [Español](README.md) · **English**

Two ready-to-run Angular 22 project templates for Coto apps, styled with `@coto-dev/ui-kit`, and a CLI wizard that generates a new project from either one.

| Template               | What it is                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| `templates/website`     | Website. Server-side rendered, main layout (header + footer), home and about pages. |
| `templates/backoffice` | Private web app. SPA, Keycloak login, same layout and pages, plus a products CRUD example. |

Both are zoneless, standalone-component apps with ESLint, Prettier, Vitest, Husky + lint-staged, a Dockerfile and nginx config, and Playwright e2e examples. Each template is a normal Angular project that builds and tests on its own.

The website is built for SEO, GEO (visibility in AI answer engines), accessibility and performance, and those rules are enforced with tests, lint and a Claude Code skill:

- **Per-route metadata** (title, description, canonical, Open Graph, Twitter, `noindex`), `robots.txt`, `sitemap.xml`, `llms.txt` and JSON-LD structured data, all derived from a single `siteUrl` that the wizard asks for when generating (`--site-url`) or that you set later with `npm run configure:seo`. While the example domain is still there, `npm run build` fails.
- **Real 404** under SSR, security headers and correct caching (hashed assets for a year, HTML not cached).
- **WCAG 2.2 AA accessibility** checked with axe in e2e, a "Skip to content" link and a single `h1` per page; **images** go through `NgOptimizedImage`, enforced by lint.
- A `CLAUDE.md` with the per-page checklist and the `web-quality-review` skill (`.claude/skills/`) to audit all of it on demand; both are copied into every generated project.

Details are in the template README (`templates/website/README.en.md`, section "SEO, GEO and web quality").

## Table of Contents

- [Requirements](#requirements)
- [Create a project](#create-a-project)
- [Develop the templates](#develop-the-templates)
- [Repository layout](#repository-layout)

---

<a id="requirements"></a>

## Requirements

- Node.js 24 (see `.nvmrc` in each template) and npm.
- Network access to the private Nexus registry that serves `@coto-dev/ui-kit`. Each template ships an `.npmrc` that points the `@coto-dev` scope to it; no credentials are needed.

<a id="create-a-project"></a>

## Create a project

This repository is not published: clone it and run the wizard from the clone.

```bash
git clone <this-repo-url> angular-template-cli
cd angular-template-cli
npm install --prefix cli     # once
npm run create               # guided wizard
```

The wizard copies the template into a folder **next to this repository** (a sibling, not inside it), renames it, and starts a fresh git repository on `main`. It asks you:

**For every project**

- **App type and name** of the project.
- **Where to create it** (default: next to this repository).
- **Existing git repository**: if you have one, it is connected as `origin`. Nothing is pushed; the summary shows the `git push` command.
- **Initial commit** (default: yes).
- **Install dependencies now** (default: no). Needs access to the private `@coto-dev/ui-kit` registry; if it fails, the project is not aborted or deleted.
- **Dark mode** (default: no, light theme only). If enabled, the header gets a light/dark toggle and the app starts in light.

**Backoffice only**

- **Keycloak** (URL, realm and client id). If you skip it, it starts in demo mode with a fake user and you can connect it later with `npm run configure:keycloak`.
- **Mock API**: a small local server that simulates the products API so the ABM works without a backend. If you decline, the ABM loads its sample products from a JSON file and changes are lost on reload.

**Website only**

- **Rendering mode**: SSR (default, Node server), SSG (prerendered static pages) or SPA (client only, limited SEO). It is applied with `npm run configure:rendering` inside the generated project.

The wizard texts are in Spanish. Press **Esc to go back** to the previous question or **Ctrl+C to exit** (nothing is written). Then:

```bash
cd ../<project-name>
npm install
npm start                    # backoffice with the mock API: also run `npm run mock:api` in a second terminal
```

Without a terminal (CI, scripts), pass everything as flags:

```bash
npm run create -- --type backoffice --name my-admin --yes
npm run create -- --type backoffice --name my-admin --yes \
  --keycloak-url https://keycloak.mycompany.com --keycloak-realm my-realm
npm run create -- --type backoffice --name my-admin --yes --no-mock-api --dark-mode
```

| Flag                          | Meaning                                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| `--type website\|backoffice`   | Kind of app                                                                              |
| `--name <name>`               | Project name: lowercase letters, numbers and single hyphens                              |
| `--out <dir>`                 | Parent directory for the new project (default: the folder that contains this repository) |
| `--keycloak-url <url>`        | Backoffice: Keycloak base URL (the part before `/realms`)                                |
| `--keycloak-realm <realm>`    | Backoffice: realm                                                                        |
| `--keycloak-client-id <id>`   | Backoffice: client id (default: the project name)                                        |
| `--no-mock-api`               | Backoffice: no mock API; the ABM uses a JSON file and keeps changes in memory            |
| `--dark-mode`                 | Support dark mode (toggle in the header; default: light only)                            |
| `--rendering <ssr\|ssg\|spa>` | Website: rendering mode (default `ssr`; `spa` has limited SEO)                        |
| `--site-url <url>`            | Website: production domain (e.g. `https://www.my-site.com`); without it, `npm run build` fails until it is set |
| `--remote <url>`              | Connect an existing git repository as `origin` (never pushes)                            |
| `--no-commit`                 | Skip the initial commit (without a terminal there is no commit by default)               |
| `--install` / `--no-install`  | Run `npm install` after generating (default: no)                                         |
| `-y`, `--yes`                 | No prompts, plain text output (needs `--type` and `--name`)                              |
| `-h`, `--help`                | Show help                                                                                |

The CLI refuses to write into a non-empty directory.

<a id="develop-the-templates"></a>

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

`node scripts/verify-templates.mjs --template website --only lint,test` runs a subset. A full run also generates a backoffice with `--no-mock-api --dark-mode` and verifies it (skip with `--skip-variant`). The script exits non-zero when any step fails.

Each template has a `README.md` (Spanish, default) and a `README.en.md` (English copy), both generated into every new project, and a `CLAUDE.md` (commands, structure and conventions for AI assistants); keep them in sync. The template name `coto-angular-template` is the placeholder the CLI replaces, so keep using it in the templates' files.

<a id="repository-layout"></a>

## Repository layout

```
cli/            wizard (Node, ESM) and its tests
templates/
  public/       public website template
  backoffice/   backoffice template
scripts/        verify-templates.mjs
openspec/       specs and change proposals (this project is built with OpenSpec)
```
