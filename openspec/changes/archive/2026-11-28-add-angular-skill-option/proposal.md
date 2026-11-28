# Proposal

## Why

The Angular team publishes an official agent skill (`angular-developer`, in https://github.com/angular/skills) that keeps generated code aligned with current Angular practices (signals, SSR, forms, testing). Both templates target Angular 22, so projects created by the CLI would benefit from it, but vendoring a copy would freeze it at one version and its license is unconfirmed.

## What Changes

- Add an optional wizard question, "install the official Angular skill?", asked for both app types and skippable.
- Add a `--angular-skill` flag (and `--no-angular-skill`) to answer it without a terminal.
- When accepted, run `npx skills add https://github.com/angular/skills` in the generated project, installing only `angular-developer`, as a new generation step.
- A failure (no network, `npx` missing, skill CLI error) is not fatal: the step reports a warning with the command to run later, and the project is kept.
- The final summary states whether the skill was installed or how to install it.
- The skill is not copied into `templates/`. The generated project's `CLAUDE.md` rules take precedence over the generic skill.

## Capabilities

### New Capabilities

### Modified Capabilities
- `cli-wizard`: adds the optional Angular skill installation requirement (question, flags, non-fatal failure, summary).

## Impact

- `cli/src/wizard.js`, `cli/src/run.js`, `cli/src/generate.js`, `cli/src/ui.js`: new option, step and summary line; help text.
- `cli/test/`: tests for the question, flags and failure handling (runner injected, no network).
- `README.md` and each template's `CLAUDE.md`: mention the optional skill and precedence of project rules.
- New runtime dependency on `npx` and network access, only when the user opts in.
