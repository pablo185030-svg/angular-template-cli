# Proposal

## Why

Generated projects only guide Claude Code: the agent instructions live in `CLAUDE.md`, the website's audit skill sits in `.claude/skills/`, and the optional Angular skill is installed for `claude-code` only. Developers using Codex, Cursor, Copilot, Gemini CLI or any other agent get none of it. `AGENTS.md` and `.agents/skills/` are the neutral conventions that most agents already read, and this repository already uses `.agents/skills/` for its OpenSpec skills.

## What Changes

- Both templates (and therefore every generated project) get an `AGENTS.md` that holds the full agent instructions. `CLAUDE.md` becomes a one-line file that imports it (`@AGENTS.md`), so Claude Code keeps working with no duplicated content.
- The website's `web-quality-review` skill moves to `.agents/skills/web-quality-review/`. Generation also exposes it at `.claude/skills/web-quality-review` (relative symlink, falling back to a copy where symlinks are not available).
- The optional Angular skill ends up in `.agents/skills/angular-developer/`, with the same `.claude/skills/` link, whichever agent folder the `skills` CLI wrote it to.
- `AGENTS.md` tells agents without skill support that `.agents/skills/web-quality-review/SKILL.md` is a plain audit guide to read on demand.
- CLI texts, READMEs and the specs stop naming Claude and talk about "AI coding agents". No new question or flag: the neutral layout is always generated.
- Out of scope: tool-specific files (`.cursor/rules`, `.github/copilot-instructions.md`), an agent-selection question in the wizard, and changes to this repository's own `CLAUDE.md`.

## Capabilities

### New Capabilities

### Modified Capabilities
- `website-agent-guidance`: instructions live in `AGENTS.md`; the audit skill lives in `.agents/skills/` and is also exposed to Claude Code.
- `cli-wizard`: the Angular skill installs into the agent-neutral location, the precedence rule refers to `AGENTS.md`, and generated projects always carry `AGENTS.md`, a `CLAUDE.md` shim and the skill links.

## Impact

- `templates/website` and `templates/backoffice`: `CLAUDE.md` → `AGENTS.md` plus shim; website skill folder moved.
- `cli/src/generate.js` (skill linking and Angular skill normalization), `cli/src/ui.js`, `cli/src/wizard.js`, `cli/src/run.js` help text, and the tests in `cli/test/` that read `CLAUDE.md` or `.claude/skills`.
- `README.md` and the template READMEs.
- No new dependencies. Existing generated projects are unaffected.
