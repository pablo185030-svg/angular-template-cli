# Tasks

## 1. Backoffice environment shape and auth service

- [x] 1.1 Replace `auth.keycloak` with `auth.authConfig` (Coto shape, wizard-friendly defaults) in `environment.ts`, `environment.prod.ts` and `environment.e2e.ts`; verify `npm run build:dev` and `ng build` succeed in `templates/backoffice`
- [x] 1.2 Update `KeycloakAuthService` to pass `authConfig` to `OAuthService.configure`, add session-end event handling and token revocation on logout, and expose payload and roles via `resource_access[clientId]`; verify new cases in `keycloak-auth.service.spec.ts` (each end event, `token_expires` ignored, roles present/absent/malformed token)
- [x] 1.3 Add `public/silent-refresh.html` and reference it from `silentRefreshRedirectUri`; verify the file is in the production build output
- [x] 1.4 Update `templates/backoffice/CLAUDE.md` and both READMEs (es/en) for the new environment shape, session end and roles helper; verify no mention of `auth.keycloak.url/realm`

## 2. Per-environment configuration script

- [x] 2.1 Extend `scripts/configure-keycloak.mjs` with environment-aware `applyKeycloakSettings(projectDir, env, settings)` (writes `issuer`, `clientId`, `requireHttps`; switches `local` to `keycloak`) and `--env <name>` / per-environment prompts; verify with updated `cli/test/configure-keycloak.test.js` (one env changes only its file, invalid values and unknown env leave files unchanged)
- [x] 2.2 Add `addEnvironment(projectDir, name)` that creates `environment.<name>.ts` from `environment.prod.ts` and adds the `<name>` build and serve configurations to `angular.json`; verify by test that the JSON stays valid, reserved and duplicate names are rejected, and a generated project builds with `ng build --configuration <name>`
- [x] 2.3 Confirm `remove-mock-api.mjs` leaves extra environments on `api.mode: 'http'` and `configure-theme.mjs` covers them; verify with tests in `cli/test/remove-mock-api.test.js` and `configure-theme.test.js` using an extra environment
- [x] 2.4 Document the script usage in the template README and CLAUDE.md; verify the documented commands run as written on a temp copy

## 3. CLI wizard, flags and generation

- [x] 3.1 Add environment-name validation and `--keycloak <env>=<url>,<realm>[,<clientId>]` parsing to `cli/src/validate.js`; verify in `cli/test/validate.test.js` (valid, repeated, reserved `e2e`, bad URL, bad format)
- [x] 3.2 Add the environments question and per-environment Keycloak questions (chained defaults, decline per environment, Esc back-navigation) to `cli/src/wizard.js`; verify in `wizard.test.js` and `back-navigation.test.js`
- [x] 3.3 Add `--environments`, repeatable `--keycloak` and keep the legacy flags (applied to all environments, mixing is a usage error, public type is a usage error) in `cli/src/run.js`; verify in `run.test.js` including the no-terminal case
- [x] 3.4 Update `cli/src/generate.js` to add the environments and apply each environment's settings through the template script; verify in `generate.test.js` that a project with `local,dev,qa,prod` contains four environment files with their own values and no `coto-angular-template` placeholder remains
- [x] 3.5 Update the final summary in `cli/src/ui.js` (environments, redirect URIs, environments still unconfigured) and the Spanish `--help` text; verify in `setup-questions.test.js` or `run.test.js`
- [x] 3.6 Update `README.md` (flags table, wizard description) in Spanish like the rest of the file; verify the examples match `--help`

## 4. Integration

- [x] 4.1 Extend `scripts/verify-templates.mjs` (or the CLI e2e test) to generate a backoffice with an extra environment and run its lint, tests and `ng build --configuration <env>`; verify `npm run verify` passes
- [ ] 4.2 Run `npm run verify` and confirm the specs in this change match the final behavior

## Workflow follow-up

- Sync the delta specs and archive the change after review.
