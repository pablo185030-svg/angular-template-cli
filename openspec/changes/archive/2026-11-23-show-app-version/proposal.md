# Proposal

## Why

It is hard to tell which version of a generated app is running. Showing the `package.json` version in the footer and in the browser console makes it easy to confirm what is deployed.

## What Changes

- Both templates read the version from `package.json` and show it in the footer.
- Both templates print a styled one-line banner in the browser console once the app has rendered: project name, environment name, version and load time.
- No new dependencies.

## Capabilities

### New Capabilities

### Modified Capabilities
- `public-template`: the footer shows the app version and the console shows a version banner.
- `backoffice-template`: the footer shows the app version and the console shows a version banner.

## Impact

- `templates/public` and `templates/backoffice`: new `shared/version/version.service.ts` (+ spec), updated `app.ts`, footer component, footer spec and `app.spec.ts`.
- No API, dependency or CLI changes. The `coto-angular-template` placeholder keeps being replaced by the CLI.
