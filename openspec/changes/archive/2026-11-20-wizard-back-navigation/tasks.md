## 1. Prompts wrapper

- [x] 1.1 In `ui.js`, wrap `clackPrompts` so Escape returns an exported `BACK` symbol and Ctrl+C returns clack's cancel symbol (temporary `keypress` listener, removed when the prompt ends); add `isBack`
- [x] 1.2 Wrap every question message to the terminal width and add the dim keys hint
- [x] 1.3 Add `redraw(answers)` to the interactive reporter (clear, header, compact list of answers) and a no-op to the plain reporter

## 2. Wizard steps

- [x] 2.1 Refactor `resolveOptions` into ordered steps with `applies`, `ask` and a cursor; keep flag validation, non-interactive results and the returned shape unchanged
- [x] 2.2 Handle `BACK`: move to the closest earlier applicable step, stay on the first, offer previous answers as initial values, treat multi-prompt steps as one unit and drop answers of steps that stop applying
- [x] 2.3 Pass `redraw` through `run.js` so going back redraws the screen

## 3. Tests and docs

- [x] 3.1 Extend `fakePrompts` with `BACK` and `isBack`; add wizard tests for going back, skipped steps, first-question Esc, changing the type, and Ctrl+C after going back
- [x] 3.2 Unit tests for the wrapper (Esc vs Ctrl+C with a fake stdin, wrapping with fake columns)
- [x] 3.3 Mention Esc/Ctrl+C in `README.md`

## 4. Verify

- [x] 4.1 Run the CLI tests and `npm run verify:quick`
- [x] 4.2 Smoke test in a pty: Esc goes back and re-asks with the previous answer, Ctrl+C exits with 130
