# Proposal

## Why

The public template ships server-side rendered only. For a site exposed to the internet, SSR, static prerendering (SSG) and a plain SPA have very different hosting, SEO and operating costs, and choosing one is the first big decision of the project. Today the only way to change it is editing `angular.json`, the Dockerfile and several source files by hand.

## What Changes

- The wizard asks the rendering mode for the public website only: SSR (default, today's behavior), SSG (prerendered static build, no Node server) or SPA (client only; the help text warns it loses SEO). New flag `--rendering <ssr|ssg|spa>`, rejected for the backoffice. Without a terminal or with `--yes` the default is SSR.
- The public template gets `scripts/configure-rendering.mjs` (`npm run configure:rendering -- --mode ssg|spa`) that converts the shipped SSR project: adjusts `angular.json` and the route render modes, rewrites `Dockerfile` and `nginx.conf` for static hosting, and removes the server files and dependencies that are no longer needed.
- The CLI runs that script on the generated project as a reported step when the mode is not SSR.
- The final summary states the chosen mode and how to change it later.
- The template itself still ships as SSR; nothing changes for users who pick SSR.

## Capabilities

### New Capabilities

### Modified Capabilities
- `cli-wizard`: new requirements for the rendering mode question, its default without a terminal, and the summary note.
- `public-template`: new requirement for the rendering mode script.

## Impact

- `templates/public/scripts/configure-rendering.mjs`, `templates/public/package.json` (script), `templates/public/README.md` and `CLAUDE.md` (document it).
- `cli/src/wizard.js`, `cli/src/run.js`, `cli/src/generate.js`, `cli/src/ui.js`, `cli/src/constants.js`; tests in `cli/test/`; `README.md` flag list.
- Independent of `wizard-fullscreen-mascot` and `wizard-project-setup-questions`; it adds its own requirements instead of editing theirs so the three archive cleanly.
