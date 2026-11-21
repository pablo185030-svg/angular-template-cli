# Proposal

## Why

The interactive wizard prints a static ASCII banner and scrolls inside the user's terminal history. We want it to feel like Claude Code: it takes over the whole screen, has a branded header with an animated pixel mascot, and leaves the terminal clean when it ends. Separately, the backoffice's products CRUD (ABM) is only a sample, and the setup does not say so.

## What Changes

- In an interactive terminal the wizard opens in the alternate screen buffer (full screen) and restores the terminal on exit, cancellation, error or Ctrl+C.
- A Claude-Code-style header (pixel mascot next to the title and a short subtitle) replaces the ASCII banner. The mascot plays a short splash animation on start and stays animated while the generation steps run.
- The final summary is reprinted in the normal terminal buffer after leaving full screen, so the next steps stay visible and copyable.
- Backoffice setup (mock API question and final summary) states that the products ABM is only a sample for testing, not a real feature.
- Plain (non-interactive) output is unchanged, except for the new summary note for the backoffice.

## Capabilities

### New Capabilities

### Modified Capabilities
- `cli-wizard`: the "Polished interactive experience" requirement now covers full-screen mode and the animated mascot header; the "Mock API clarified as a mock" requirement also states that the products ABM is only a sample, and the next steps summary repeats it for the backoffice.

## Impact

- `cli/src/ui.js` (reporter, summary), new `cli/src/mascot.js` and `cli/src/screen.js`, `cli/src/wizard.js` (question text).
- Tests under `cli/test/`. No dependency changes, no template changes.
