## Context

`wizard.js#resolveOptions` resolves options from flags and prompts, `run.js` parses flags and calls `generateProject`, which runs ordered steps through `runStep`. `generateProject` currently ends with `git init -b main`; there is no commit, remote or install. `run.js` already injects `runGit`/`runNode` for tests. Flags use `--no-*` for negatives, parsed by hand into `false`/`undefined`.

## Goals / Non-Goals

**Goals:** four new questions with flags and safe non-interactive defaults; summary that does not repeat done steps.
**Non-Goals:** pushing code, creating remote repos (no GitHub/GitLab API), changing templates, full-screen UI (separate change).

## Decisions

- **Question order:** type, name, location, Keycloak/mock/dark (as today), remote, commit, install. Location comes right after the name so the summary path is known early.
- **Defaults:** interactive prompts default to commit = yes, install = no, remote = no. Without terminal everything new is off, preserving today's behavior (a commit would also fail on machines without git identity). This differs from the interactive commit default on purpose; recorded in the spec.
- **Remote:** `git remote add origin <url>` right after `git init`, as part of the "Inicializando el repositorio git" step or a separate "Configurando el remoto" step. Validation: non-empty, no whitespace. We do not verify reachability. The CLI never pushes (outward-facing action); the summary shows `git push -u origin main`.
- **Commit:** `git add -A` and `git commit -m "chore: initial commit"` through the existing `runGit`. Failure (no identity) is caught: the step reports a warning, the project stays and later steps continue. A remote with no commit still works; the push line is shown only when a commit exists, otherwise the summary says to commit first.
- **Install:** `npm install` in the project via an injectable `runNpm`/`runCommand` (default `execFileSync('npm', ['install'], { stdio: 'pipe' })`, `npm.cmd` on Windows), run with `HUSKY=0` so husky does not touch git config. Runs BEFORE the commit so the generated `package-lock.json` is included in it; `node_modules` is already ignored by the template's `.gitignore`. Failure is caught and reported; the summary then keeps `npm install`.
- **Warning text** about the private registry appears in the install prompt message.
- **Step failure model:** commit and install failures are non-fatal. `runStep` rethrows, so these steps catch the error themselves, report it through a new optional reporter method `warn(message)` (plain: a `Aviso:` line; interactive: `clack.log.warn`), and return normally. They must still show a failed/warn state for the step.
- **Summary:** `buildSummary` receives `installed`, `remote`, `committed` and builds commands from them.
- **Location prompt:** text prompt with the default shown as initial value; resolved to an absolute path like `--out` today (relative to `cwd`).

## Risks / Trade-offs

- Install can take minutes; the step spinner stays up. Acceptable; it is opt-in.
- Non-interactive default differs from the interactive commit default; documented to protect existing scripts.
- Order of install/commit in non-fatal failure paths adds branching; covered by tests with injected runners.
