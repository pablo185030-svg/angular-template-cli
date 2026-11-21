## 1. Generation steps

- [x] 1.1 In `generate.js`, add `addRemote`, `createInitialCommit` and `installDependencies` (injectable runners; `HUSKY=0`; `npm.cmd` on Windows)
- [x] 1.2 Extend `generateProject` with `remote`, `commit` and `install` options and the new ordered steps (git init, remote, install, commit); commit and install failures are non-fatal and reported as warnings
- [x] 1.3 Add an optional `warn` method to both reporters in `ui.js`

## 2. Questions and flags

- [x] 2.1 In `wizard.js`, add the location, remote (with URL validation in `validate.js`), commit and install questions with their defaults
- [x] 2.2 In `run.js`, parse `--remote`, `--no-commit`, `--install` and `--no-install`, reject contradictory flags, pass the answers on, update `HELP`
- [x] 2.3 Skip all new questions without a terminal or with `--yes`, using the non-interactive defaults

## 3. Summary and docs

- [x] 3.1 Make `buildSummary` omit `npm install` when installed and add the push command when a remote was set
- [x] 3.2 Update `README.md` with the new questions and flags

## 4. Tests and verification

- [x] 4.1 Tests for generate steps (remote, commit, install, non-fatal failures) with injected runners
- [x] 4.2 Tests for wizard questions, flags, validation, non-interactive defaults and the summary
- [x] 4.3 Run the CLI tests and `npm run verify:quick`
