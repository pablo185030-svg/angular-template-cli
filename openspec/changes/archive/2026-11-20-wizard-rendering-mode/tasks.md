## 1. Template script

- [x] 1.1 Add `templates/public/scripts/configure-rendering.mjs` exporting `applyRendering(projectDir, mode)` and the CLI entry (`--mode ssg|spa`), with the SSR-state check and mode validation
- [x] 1.2 Implement SSG: `angular.json`, `app.routes.server.ts`, removal of `server.ts`, `express`, `@types/express` and `serve:ssr`, static `Dockerfile` and `nginx.conf`
- [x] 1.3 Implement SPA: `angular.json`, removal of the server files and `@angular/ssr`, hydration provider cleanup, static `Dockerfile` and `nginx.conf` with `index.html` fallback
- [x] 1.4 Add the `configure:rendering` script to `package.json`; document it in the template's `README.md` and `CLAUDE.md`
- [x] 1.5 Tests (`cli/test/configure-rendering.test.js`): convert a copy of the template in each mode, check files and config, refuse already-converted projects and bad modes

## 2. Wizard

- [x] 2.1 In `wizard.js`, add the rendering question (public only) and `--rendering` handling with validation and the backoffice rejection
- [x] 2.2 In `run.js`, parse the flag, update `HELP`, pass the mode on; add the generation step in `generate.js`
- [x] 2.3 Add the mode note and the "convert later" hint to `buildSummary`; update the root `README.md` flag list
- [x] 2.4 Tests for question, flag validation, default without a terminal, generation step and summary

## 3. Verify

- [x] 3.1 Extend `scripts/verify-templates.mjs` to convert a copy to SSG and to SPA and build each
- [x] 3.2 Run the CLI tests and `npm run verify:quick`
