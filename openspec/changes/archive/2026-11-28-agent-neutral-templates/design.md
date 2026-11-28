## Context

`CLAUDE.md` is the only instruction file in the templates and `.claude/skills/` the only skill location, so only Claude Code sees them. `AGENTS.md` is read by Codex, Cursor, Copilot, Gemini CLI and others, and `.agents/skills/` is the shared skills folder (this repository already uses it, with symlinks from `.claude/skills/`). Claude Code reads `CLAUDE.md` and `.claude/skills/` but supports `@path` imports in `CLAUDE.md`.

## Goals / Non-Goals

**Goals:** one source of truth for instructions and skills; Claude Code behaviour unchanged; no wizard question or flag; no new dependencies.
**Non-Goals:** per-tool files (`.cursor/rules`, `.github/copilot-instructions.md`); converting `SKILL.md` to other formats; changing this repository's own `CLAUDE.md`.

## Decisions

1. **`AGENTS.md` holds the content; `CLAUDE.md` is `@AGENTS.md`.** Alternative: a symlink `CLAUDE.md -> AGENTS.md`. Rejected: symlinks are fragile on Windows and in git, and an import is supported by Claude Code. Alternative: keep both files in sync by hand. Rejected: drift.
2. **Skills live in `.agents/skills/`, linked into `.claude/skills/` at generation.** The templates ship only `.agents/skills/web-quality-review/`; a CLI step `linkSkillsForClaude(directory)` creates a relative symlink per skill in `.claude/skills/`, and copies the folder when `symlink` throws (Windows without privileges). Doing it in the CLI, not in the template, keeps the template free of symlinks that `cp` and git handle badly. Run it after the template copy and after the Angular skill step, before the initial commit.
3. **Angular skill location does not depend on the `skills` CLI.** The install command keeps `-a claude-code --copy`, which writes to `.claude/skills/angular-developer`. Afterwards a normalization step moves that real folder to `.agents/skills/angular-developer` (when it does not already exist there) and `linkSkillsForClaude` links it back. This avoids relying on how the `skills` CLI maps other agents to folders; the exact flags are re-checked during implementation, and if it can write to `.agents/skills` directly the move step becomes a no-op.
4. **Skill-less agents.** `AGENTS.md` carries one line pointing at `.agents/skills/web-quality-review/SKILL.md` as a plain audit guide, so the rules do not depend on skill support. The mechanical guardrails (tests, lint) already cover enforcement.
5. **Wording.** User-facing text, READMEs and specs say "AI coding agents"; Claude is named only where it is a fact about layout (the `CLAUDE.md` shim, `.claude/skills/`).
6. **`replacePlaceholders` and `EXCLUDED_NAMES`** are unaffected: both files are plain text and folders start with `.`, which are already copied.

## Risks / Trade-offs

- Symlinks inside a committed generated project may behave differently on Windows checkouts → git on Windows without symlink support checks them out as small text files. Mitigation: documented limitation; on Windows generation falls back to copies, which are committed as regular files.
- Agents that ignore `AGENTS.md` (rare) get nothing → accepted; they can be pointed at the file.
- Moving the Angular skill depends on the `skills` CLI output path → covered by a test with an injected runner that writes to `.claude/skills/`, and a failure still only warns.
