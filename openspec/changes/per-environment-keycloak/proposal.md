# Proposal

## Why

Each environment of a real Coto backoffice (local, dev, qa, prod, ...) has its own Keycloak, but the wizard only writes one URL, realm and client id, copied into two files. Teams then rewrite the auth setup by hand. The template's auth also differs from what Coto backoffices run today (full `authConfig` per environment, session-end handling, token revocation on logout, silent refresh). Generated projects should start from the shape the company actually uses.

## What Changes

- The wizard asks which environments the backoffice has (`local` and `prod` always, plus any extra named environments such as `dev`, `qa`, `staging`) and then asks Keycloak URL, realm and client id **per environment**, offering the previous answer as the default. A non-prod environment can also be left unconfigured.
- The CLI generates one environment file and one Angular build/serve configuration per extra environment, each carrying its own Keycloak settings.
- New repeatable flag `--keycloak <env>=<url>,<realm>[,<clientId>]` and `--environments <list>`; the existing `--keycloak-url/--keycloak-realm/--keycloak-client-id` flags keep working and apply to every environment.
- The backoffice environment files replace the `auth.keycloak { url, realm, clientId }` block with a full per-environment `auth.authConfig` (Coto's shape: `issuer`, `clientId`, `redirectUri`, `silentRefreshRedirectUri`, `responseType`, `scope`, `requireHttps`, `timeoutFactor`, ...). The wizard fills `issuer`, `clientId` and `requireHttps`; the rest are Coto defaults.
- `KeycloakAuthService` adopts Coto's behavior: logs the user out on `logout`, `session_terminated`, `token_refresh_error` and `silent_refresh_error`, revokes the token on logout, keeps automatic silent refresh, and exposes the token payload and the roles read from `resource_access[<clientId>]` (read only, no enforcement).
- `npm run configure:keycloak` becomes environment-aware (`--env <name>`; without it, asks per environment). Demo mode (`mock`) stays for `local` and `e2e`.
- The final summary lists the environments and the redirect URI to register in each Keycloak client.
- **BREAKING** (template shape only): `environment.auth.keycloak` is replaced by `environment.auth.authConfig`; projects generated earlier are not migrated.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `cli-wizard`: the Keycloak requirement becomes per-environment (environment selection, per-environment questions and flags, summary).
- `backoffice-template`: Keycloak configuration is a full per-environment auth config; the configure command is environment-aware; session-end handling, token revocation and role reading from the token are added.

## Impact

- `cli/src/wizard.js`, `run.js`, `generate.js`, `validate.js`, `ui.js`; new environment-file/`angular.json`/`package.json` generation step in the CLI; CLI tests.
- `templates/backoffice`: `src/environments/*`, `src/app/core/auth/*`, `angular.json`, `scripts/configure-keycloak.mjs`, `public/silent-refresh.html`, README (es/en), `CLAUDE.md`, tests.
- `scripts/remove-mock-api.mjs` and `configure-theme.mjs` must also cover the generated environment files.
- No new dependencies (`angular-oauth2-oidc` is already used).
