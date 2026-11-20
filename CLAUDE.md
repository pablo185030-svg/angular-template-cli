# Project Guidelines

## Overview
- This repository holds two Angular 22 project templates (`templates/public`, `templates/backoffice`) styled with `@coto-dev/ui-kit`, and a Node CLI wizard (`cli/`) that generates a new project from either one. See `README.md`.
- This project is developed using [OpenSpec](https://github.com/Fission-AI/OpenSpec) (spec-driven development). Specs and change proposals live in the `openspec/` directory.

## Layout
- `cli/`: the wizard (ESM JavaScript, `@clack/prompts`). Tests: `npm test --prefix cli` (Node's built-in runner).
- `templates/public/`, `templates/backoffice/`: complete, buildable Angular projects. Each has its own `CLAUDE.md` with commands and conventions; read it before changing that template.
- `scripts/verify-templates.mjs`: installs, lints, tests, builds and runs e2e for every template, then the CLI tests (`npm run verify`).
- `openspec/`: specs (`openspec/specs/`) and changes (`openspec/changes/`).

## Rules for the templates
- The template name `coto-angular-template` is the placeholder the CLI replaces in generated projects. Keep it as the project name in `package.json`, `angular.json`, titles, etc.
- Install template dependencies with `HUSKY=0 npm install` (husky would otherwise change this repository's git config).
- Templates must stay simple: no team-specific policy tooling, no demo pages, no color palette of their own (colors come from the ui-kit).
- Run a single test, not the whole suite, while iterating. Before finishing, run `npm run verify` (or `npm run verify:quick`).

## Workflow (OpenSpec)
- Before implementing a feature or behavior change, create or update an OpenSpec change. Use the project skills: `/openspec-explore`, `/openspec-propose`, `/openspec-apply-change`, `/openspec-update-change`, `/openspec-sync-specs`, `/openspec-archive-change`.
- Implement against the approved specs and tasks; keep specs in sync with the code.
- Archive completed changes so the specs reflect the current state of the system.

## Language
- Everything must be written in English, regardless of the language used in prompts (e.g. Spanish). This includes code, comments, identifiers, commit messages, documentation, specs, proposals, and tasks.
