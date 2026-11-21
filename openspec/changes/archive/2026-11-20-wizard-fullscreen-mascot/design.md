## Context

`cli/src/ui.js` wraps `@clack/prompts` and prints a static banner. `run.js` talks to a reporter (`intro`, `runStep`, `summary`, `cancelled`, `error`), so the full-screen behavior can live entirely in the interactive reporter. Tests inject their own reporters, and plain output must not change.

## Goals / Non-Goals

**Goals:** full-screen interactive mode, animated mascot, safe terminal restore, summary kept after exit.
**Non-Goals:** new dependencies, changes to prompts' logic, changes to templates, animation in non-interactive mode.

## Decisions

- **Alternate screen via ANSI** (`ESC[?1049h` / `ESC[?1049l`), no dependency. A small `screen.js` enters/leaves it idempotently and hides/shows the cursor around animations. Restoration is registered on `process.on('exit')` and `SIGINT`/`SIGTERM` so a crash never leaves the terminal broken.
- **Mascot (an octopus, violet) as a pixel grid** rendered with half-block characters (`▀▄█`) in a single orange truecolor/256-color foreground; eyes are transparent pixels. Frames: idle, blink and swaying tentacles. Lives in `mascot.js` as pure functions returning lines, so it is testable.
- **Header**: mascot on the left, bold title and dim subtitle on the right (like Claude Code). Drawn after clearing the screen.
- **Animation scope**: clack redraws with relative cursor moves, so animating while a prompt is active would corrupt it. The mascot animates (a) in a ~1.2 s splash at `intro`, and (b) during `runStep`, where the reporter replaces the clack spinner with its own redraw loop (clear, header with the next frame, step list with done/running marks). Between prompts the header is static.
- **Summary**: `summary`/`cancelled`/`error` leave the alternate screen first, then print with clack (`note`/`outro`) in the normal buffer so the text survives.
- **Fallbacks**: if stdout is not a TTY or `NO_COLOR`/dumb terminal is detected, behave like today's plain/inline mode.
- **ABM note**: add the sentence to the mock API question in `wizard.js` and a line in `buildSummary` for the backoffice (both modes).

## Risks / Trade-offs

- Terminals without alternate-screen support just show the content inline; acceptable.
- Own spinner loop must stop timers on failure to avoid a stuck cursor; handled in `finally`.
