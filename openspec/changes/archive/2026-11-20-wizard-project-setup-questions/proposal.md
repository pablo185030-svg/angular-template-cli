# Proposal

## Why

The wizard only asks about app type, name, Keycloak, mock API and dark mode. Other decisions a developer makes right after generating a project have no question: where to create it (only the hidden `--out` flag), whether it already has a git repository to push to, whether to make the first commit, and whether to install dependencies. Today the user has to do all of that by hand.

## What Changes

- Ask where to create the project (default: the folder next to this repository); the existing `--out` flag answers it.
- Ask whether the user already has a git repository and its URL; if so, add it as `origin`. The CLI never pushes; the summary shows the push command. New flag `--remote <url>`.
- Ask whether to create an initial commit. New flag `--no-commit` declines.
- Ask whether to install dependencies now, warning that it needs access to the private `@coto-dev/ui-kit` registry. A failed install is reported but does not abort or delete the project. New flags `--install` / `--no-install`.
- The final summary skips steps already done (install, remote) and adds the push command when a remote was set.
- Without a terminal or with `--yes` nothing new is asked and behavior stays as today (no remote, no commit, no install).

## Capabilities

### New Capabilities

### Modified Capabilities
- `cli-wizard`: new requirements for the output directory, git remote, initial commit and dependency installation questions; "Next steps guidance" and "Defaults without a terminal" are extended accordingly.

## Impact

- `cli/src/wizard.js` (new questions and flags), `cli/src/generate.js` (remote, commit, install steps), `cli/src/run.js` (flags, help, summary data), `cli/src/ui.js` (summary).
- Tests under `cli/test/`, `README.md` flag list. No template or dependency changes. Independent of `wizard-fullscreen-mascot`.
