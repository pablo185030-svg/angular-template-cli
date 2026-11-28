# Tasks

## 1. Option and flags

- [x] 1.1 Add the `angularSkill` confirm step (default no) to `cli/src/wizard.js` and the `--angular-skill` / `--no-angular-skill` flags to `cli/src/run.js` (parsing, conflict error, help text); verify with `node --test cli/test/wizard.test.js` and `cli/test/setup-questions.test.js` covering prompt, flags and conflict.

## 2. Installation step

- [x] 2.1 Add `installAngularSkill` with an injectable `runSkills` runner in `cli/src/generate.js`, run after `git init` and before the initial commit as a non-fatal step; verify against the real `skills` CLI that `-a claude-code -s angular-developer --copy -y` creates `.claude/skills/angular-developer/` (adjust flags if not).
- [x] 2.2 Test success, skipped and failure (warning, project kept, exit 0) in `cli/test/generate.test.js` with a fake runner; verify with `node --test cli/test/generate.test.js`.

## 3. Summary and docs

- [x] 3.1 Show the installed state, or the manual `npx skills add https://github.com/angular/skills` command on failure/decline, in the summary in `cli/src/ui.js`; verify with the UI/run tests.
- [x] 3.2 Add the one-line precedence note to `templates/website/CLAUDE.md` and `templates/backoffice/CLAUDE.md`, and document the option and flags in `README.md`; verify generated projects contain the note (generate test).

## 4. Integration

- [x] 4.1 Run `npm test --prefix cli` and `npm run verify:quick`; both pass.
