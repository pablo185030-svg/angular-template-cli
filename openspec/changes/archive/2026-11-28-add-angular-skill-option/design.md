# Design

## Context

The wizard (`cli/src/wizard.js`) is a list of steps, some asked via `confirmStep`; `generateProject` (`cli/src/generate.js`) runs one `runStep` per action and already treats `npm install` and the initial commit as non-fatal, with injectable runners for tests. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- Reuse the existing confirm-step and non-fatal-step patterns; no new architecture.
- Always get the up-to-date skill, without vendoring it.

**Non-Goals:**
- Installing `angular-new-app` (the project already exists).
- Installing for agents other than Claude Code.
- Pinning a skill version.

## Decisions

- **Install via the `skills` CLI, not a copy.** `npx -y skills add https://github.com/angular/skills -s angular-developer -a claude-code --copy -y` run with the project as cwd. Alternative: vendor the skill in `templates/`: rejected (goes stale, license unconfirmed). `--copy` writes real files into `.claude/skills/` so they can be committed, instead of symlinks.
- **A `confirmStep('angularSkill')`, default no.** It is asked after `install`, because the generated project must exist first, and the flags are `--angular-skill` / `--no-angular-skill`, like `--install` / `--no-install`. Default no keeps generation offline-friendly and unchanged for existing scripts.
- **Runs after `git init` and before the initial commit**, so the installed files land in that commit. A new injectable `runSkills` runner (like `runNpm`) makes it testable without network.
- **Non-fatal step**, mirroring `install`: the action returns a warning string with the manual command.
- **Precedence note in each template `CLAUDE.md`** (one line), since the generic skill may suggest patterns that conflict with Signal Forms, BEM, ui-kit colors, etc.

## Risks / Trade-offs

- [`skills` CLI flags or agent id change] → the step is non-fatal and the manual command is shown; verify `-a claude-code` and `-s angular-developer` against the real CLI during implementation.
- [Skill content conflicts with template rules] → precedence line in `CLAUDE.md`.
- [Telemetry or network use by `skills`] → only on explicit opt-in; mention the network need in the question text.
