# Proposal

## Why

The guided wizard now asks up to ten questions, and any cancel exits it: a wrong answer, or just wanting to change one, means starting over. In addition, several questions are a single very long line that the terminal cuts at its edge, so the user cannot read the explanation (location, Keycloak, mock API and dark mode questions).

## What Changes

- In the guided flow, **Esc goes back** to the previous question so the answer can be changed; **Ctrl+C still exits** (exit code 130, nothing written). Esc on the first question does nothing.
- Going back skips the questions that were not asked (answered by a flag, or not applicable to the app type) and offers the previous answer as the initial value.
- A short hint ("Esc: volver · Ctrl+C: salir") tells the user about the keys.
- Long question texts are wrapped to the terminal width, so nothing is cut.
- `resolveOptions` becomes an ordered list of steps with a cursor instead of linear code. Flag validation, non-interactive behavior and the returned options are unchanged.

## Capabilities

### New Capabilities

### Modified Capabilities
- `cli-wizard`: adds requirements for back navigation and for readable (wrapped) questions. No existing requirement text changes, so it archives cleanly next to `wizard-rendering-mode`.

## Impact

- `cli/src/wizard.js` (steps with a cursor), `cli/src/ui.js` (`clackPrompts` wrapper: Esc detection, wrapping, hint; full-screen redraw on back), `cli/support/test-helpers.js` (`fakePrompts` supports back), tests in `cli/test/`, `README.md`.
- No template or dependency changes.
