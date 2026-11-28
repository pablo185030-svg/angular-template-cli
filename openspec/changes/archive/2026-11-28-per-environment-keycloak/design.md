# Design

## Context

- Today `environment.ts` (local), `environment.prod.ts` and `environment.e2e.ts` each hold `auth.mode` and `auth.keycloak { url, realm, clientId }`. `KeycloakAuthService` builds an `AuthConfig` from them at runtime. The CLI runs `scripts/configure-keycloak.mjs` once, which regex-edits `environment.ts` and `environment.prod.ts` with the same values.
- `angular.json` has `production` (replaces `environment.ts` with `environment.prod.ts`), `development` and `e2e` configurations; `configure-theme.mjs` already edits every `environment*.ts`, `remove-mock-api.mjs` uses a fixed file list.
- Coto's real backoffice keeps a full `AuthConfig` in `environment.authConfig`, listens to OAuth events to end the session, revokes the token on logout (skipped for `mock`), and reads roles from `resource_access['<client>']`. See proposal.md for motivation.
- `backoffice-roles` requires that the template never enforces roles; reading them stays allowed.

## Goals / Non-Goals

**Goals:**
- One Keycloak configuration per environment, chosen in the wizard or by flags, written to its own file.
- Template auth behaves like Coto's (session end, revocation, silent refresh, roles helper), keeping the demo mode.

**Non-Goals:**
- Role-based guards or UI, a roles ABM (stays in `backoffice-roles`).
- Per-environment values other than Keycloak (API URL, theme) in the wizard.
- Migrating projects generated before this change.
- Changing the public template.

## Decisions

1. **Environment model.** `local` (file `environment.ts`, the default build) and `prod` (`environment.prod.ts`, the `production` configuration) always exist; extra environments get `environment.<name>.ts` and a build and serve configuration named `<name>`. `e2e` stays mock-only and is reserved. Names are lowercase kebab-case, unique. *Alternative:* fixed `dev/qa/prod` set: rejected, the user asked to choose.
2. **Extra environments are generated from `environment.prod.ts`.** The CLI copies it, sets `envName`, and the new `angular.json` configuration copies the `production` options (budgets, hashing, optimization) with its own `fileReplacements`. Non-prod environments therefore behave like deployed builds but never use `mock`. *Alternative:* a template file per environment shipped in the repo: rejected, the set is dynamic.
3. **`auth.authConfig` replaces `auth.keycloak`.** Environment shape: `auth: { mode, authConfig: AuthConfig-compatible object }`. The wizard fills `issuer` (`<url>/realms/<realm>`), `clientId` and `requireHttps` (true unless the URL is http); `redirectUri` and `silentRefreshRedirectUri` use `window.location.origin`, so one build config works for any host; `responseType: 'code'`, `scope: 'openid profile email'`, `timeoutFactor: 0.9` are Coto defaults. The auth service passes `authConfig` to `OAuthService.configure` unchanged. The `url`/`realm` split is dropped; `configure:keycloak` parses the issuer back for its prompts.
4. **Generation lives in one shared module.** Environment file creation, `angular.json` and the `package.json` scripts are produced by a script in the template (`scripts/configure-keycloak.mjs` gains `addEnvironment(projectDir, name)` plus `applyKeycloakSettings(projectDir, env, settings)`), and the CLI calls it as it does today. This keeps the template self-sufficient (`npm run configure:keycloak -- --env qa`) and avoids duplicating the file-editing logic in the CLI. `angular.json` is edited as parsed JSON, not by regex. Existing helper style (regex over TS) stays for the environment files, whose shape the template controls.
5. **Wizard flow.** After the app-type and name questions: environment names (comma-separated text, default `local,prod`, `local` and `prod` always included), then per environment "configure now?" (local declines → demo, other declines → placeholders) and URL, realm, client id. Defaults chain from the previous environment; client id defaults to the project name. Esc steps back through the sub-questions like the existing Keycloak step.
6. **Flags.** `--environments dev,qa` (extras; `local` and `prod` implied), repeatable `--keycloak <env>=<url>,<realm>[,<clientId>]` (URL contains `:`, so the separator is `=` then `,`). Legacy `--keycloak-url/--keycloak-realm/--keycloak-client-id` apply to all environments. Mixing both forms is a usage error. Any of them with the public type is a usage error, as today.
7. **Auth service.** `KeycloakAuthService` subscribes to `oauth.events`; `logout`, `session_terminated`, `token_refresh_error`, `silent_refresh_error` clear the local state and call `revokeTokenAndLogout()`; `token_expires` is explicitly not a logout trigger. `MockAuthService` is unchanged and never revokes (equivalent to Coto's `shouldRevoke`). Roles come from `resource_access[authConfig.clientId].roles`, via a small token-decoding helper (the template already has `decode-token.ts`). The initial login keeps `loadDiscoveryDocumentAndTryLogin` plus the guard-driven `login(targetUrl)` so deep links are restored, instead of Coto's `loadDiscoveryDocumentAndLogin`.
8. **Silent refresh.** Keep refresh-token based `setupAutomaticSilentRefresh()`; `silentRefreshRedirectUri` is set and `public/silent-refresh.html` ships as in Coto so iframe-based refresh works if the realm requires it.
9. **Other scripts.** `remove-mock-api.mjs` keeps editing only `local` and `e2e`: extra environments are deployed ones and stay on `api.mode: 'http'`, like `prod`. `configure-theme.mjs` already edits every `environment*.ts`.

## Risks / Trade-offs

- [`angular.json` edits break a project] → generate from parsed JSON, and verify with a real `ng build --configuration <env>` for a generated project in `npm run verify`.
- [More wizard questions slow the common path] → ask only for the environment list first; the default `local,prod` with Keycloak declined stays two answers.
- [Extra environments built with `production: true` semantic] → only `envName`, `requireHttps` and Keycloak values differ; no code branches on `production` for auth.
- [Revoking on `token_refresh_error` loops with a flaky network] → same behavior as Coto's service; covered by unit tests, revoke called once per event.
- [Breaking environment shape] → documented as breaking; template-only, no migration tool.

## Migration Plan

Regenerate projects with the new CLI. Existing generated projects can copy the new `core/auth` files and environment shape manually; no automated migration. The change is archived after `npm run verify` passes.

## Open Questions

- Whether Coto wants `silent-refresh.html` (iframe) kept or dropped now that refresh tokens are used; the file is included and can be deleted later without changing specs.
