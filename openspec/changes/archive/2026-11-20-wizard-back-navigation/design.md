## Context

`resolveOptions` in `cli/src/wizard.js` asks questions in straight-line code; `clackPrompts` in `cli/src/ui.js` wraps `@clack/prompts`. In `@clack/core` 1.6.0 both Escape and Ctrl+C map to the same `cancel` action, so a prompt returns the same cancel symbol for either key and the wizard cannot tell them apart. Clack prints a long `message` as one line, which the terminal clips (seen on the location, Keycloak, mock API and dark mode questions).

## Goals / Non-Goals

**Goals:** Esc goes back, Ctrl+C exits; readable questions; no change for flags and non-interactive runs.
**Non-Goals:** editing answers from the summary, a confirmation screen before generating, changing the question texts, new dependencies.

## Decisions

- **Telling Esc from Ctrl+C:** `clackPrompts` attaches a temporary `keypress` listener on `process.stdin` while a prompt is active (clack already calls `readline.emitKeypressEvents`), remembering the last key. When the prompt resolves to clack's cancel symbol, the wrapper returns a `BACK` symbol if the last key was `escape`, otherwise the cancel symbol. The listener is removed when the prompt ends. `prompts.isBack(value)` is the check; `isCancel` keeps meaning Ctrl+C. Rejected: replacing clack prompts with `@clack/core` subclasses (much more code) and a "‹ Volver" menu option (does not work for text and confirm prompts).
- **Steps with a cursor:** `resolveOptions` builds an ordered array of steps (`type`, `name`, `outDir`, `keycloak`, `mockApi`, `darkMode`, `rendering`, `remote`, `commit`, `install`). Each step has `applies(state)` (false when a flag answered it, it does not apply to the app type, or the run is not interactive) and `ask(state, initialValue)`. A cursor walks forward; on `BACK` it moves to the closest earlier step that applies, or stays when there is none. Answers live in a state object so a step re-asked on the way back gets its previous answer as the initial value; the multi-prompt steps (Keycloak URL, realm, client id; remote yes/no + URL) go back as one unit.
- **Validation and defaults stay where they are:** flag validation and `UsageError`s run before the loop; non-interactive resolution does not use the loop at all, so its results are byte-for-byte what they are today. The returned object keeps its shape.
- **Esc on the first asked step:** `BACK` with no earlier step re-asks the same step.
- **Changing the app type on the way back:** if the user goes back and picks another type, the answers of steps that no longer apply (for example the backoffice-only ones) are dropped from the state.
- **Hint:** the wrapper adds a dim line "Esc: volver · Ctrl+C: salir" under each question in the guided flow (first question: "Ctrl+C: salir" only).
- **Wrapping:** the wrapper wraps `message` to `columns - 6` (clack's prefix and padding) with explicit newlines, never splitting words; the text itself is untouched, so existing question tests still match. `columns` falls back to 80.
- **Full-screen redraw:** the interactive reporter exposes `redraw(answers)`; the wizard calls it when going back so the screen is cleared and the header redrawn before the question is asked again (a compact "Tipo: backoffice · Nombre: x ..." line is shown under the header). Plain (non-interactive) reporters ignore it.
- **Tests:** `fakePrompts` accepts a `BACK` marker and `isBack`; wizard tests drive the cursor through queues of answers and backs. Esc detection and wrapping are unit-tested with a fake stdin and fake columns.

## Risks / Trade-offs

- Some terminals send Esc late or as part of an escape sequence; clack already waits 50 ms (`escapeCodeTimeout`), and the listener only reacts to a lone `escape` key name.
- The listener depends on clack using the process stdin keypress events; covered by a pty smoke test in the tasks.
- Refactoring to steps touches most of `wizard.js`; the existing wizard tests are the safety net.
