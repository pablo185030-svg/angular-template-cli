## 1. Templates

- [x] 1.1 In `templates/website` and `templates/backoffice`, rename `CLAUDE.md` to `AGENTS.md`, replace Claude-specific wording and the `.claude/skills/...` paths with `.agents/skills/...`, and create a `CLAUDE.md` containing only `@AGENTS.md`
- [x] 1.2 Move `templates/website/.claude/skills/web-quality-review/` to `templates/website/.agents/skills/web-quality-review/` and update its references to `CLAUDE.md` → `AGENTS.md`
- [x] 1.3 Add to the website `AGENTS.md` the line telling agents without skill support to read `.agents/skills/web-quality-review/SKILL.md` as an audit guide
- [x] 1.4 Update the precedence sentence about the Angular skill in both `AGENTS.md` files (path `.agents/skills/angular-developer`)

## 2. CLI

- [x] 2.1 Add `linkSkillsForClaude(directory)` to `cli/src/generate.js`: relative symlink per `.agents/skills/*` into `.claude/skills/`, copy fallback when symlinking fails, idempotent
- [x] 2.2 After `installAngularSkill`, move a real `.claude/skills/angular-developer` to `.agents/skills/angular-developer` when absent there; update its doc comment
- [x] 2.3 Call the linking step in the generation flow after the template copy and the Angular skill step, before the initial commit
- [x] 2.4 Make the texts in `cli/src/ui.js`, `cli/src/wizard.js` and `cli/src/run.js` agent-neutral (no "para Claude Code", `AGENTS.md` instead of `CLAUDE.md`)

## 3. Tests

- [x] 3.1 Update `cli/test/generate.test.js`: generated projects contain `AGENTS.md`, a `CLAUDE.md` importing it, `.agents/skills/web-quality-review/SKILL.md` and its `.claude/skills/` counterpart; precedence text is in `AGENTS.md`
- [x] 3.2 Add unit tests for `linkSkillsForClaude` (symlink, copy fallback, idempotent) and for the Angular skill move with an injected runner
- [x] 3.3 Update `cli/test/setup-questions.test.js` expectations that mention Claude-specific text, if any

## 4. Docs and specs

- [x] 4.1 Update `README.md` and `templates/website/README.md` / `README.en.md` (and backoffice READMEs if they mention `CLAUDE.md`) to describe `AGENTS.md` and `.agents/skills/`
- [x] 4.2 Update the root `CLAUDE.md` rule about template guidance files (mention `AGENTS.md`)

## 5. Verify

- [x] 5.1 Run the touched CLI tests individually, then `npm run verify:quick` (or `npm run verify`) and typecheck
