## 1. Screen and mascot

- [x] 1.1 Add `cli/src/screen.js` (enter/leave alternate screen, hide/show cursor, clear, idempotent restore, exit/signal hooks)
- [x] 1.2 Add `cli/src/mascot.js` (pixel grid, half-block renderer, idle/blink/legs frames, header builder)
- [x] 1.3 Unit tests for the mascot frames and the screen escape sequences

## 2. Interactive reporter

- [x] 2.1 Replace the ASCII banner with the header and splash animation in `intro`
- [x] 2.2 Replace the clack spinner in `runStep` with the animated step list, stopping timers on success or failure
- [x] 2.3 Leave full screen before `summary`, `cancelled` and `error` so the output stays visible

## 3. Backoffice sample note

- [x] 3.1 Update the mock API question in `wizard.js` to say the products ABM is only a sample
- [x] 3.2 Add the sample note to `buildSummary` for the backoffice and update tests

## 4. Verify

- [x] 4.1 Run the CLI tests, typecheck/lint if applicable, and try the wizard in a real terminal
- [x] 4.2 Run `npm run verify:quick`
