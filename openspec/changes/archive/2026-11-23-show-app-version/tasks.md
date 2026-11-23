# Tasks

## 1. Public template

- [x] 1.1 Add `shared/version/version.service.ts` and its spec (semver string, banner logged once with name, env and version); verify with `npx ng test --include='**/version.service.spec.ts'` in `templates/public`
- [x] 1.2 Call `logBannerVersion()` from `afterNextRender` in `App`; update `app.spec.ts` if needed and verify it passes
- [x] 1.3 Show the version in the footer and update `footer.spec.ts`; verify the footer spec passes

## 2. Backoffice template

- [x] 2.1 Apply the same service, spec, `App` and footer changes; verify the three specs pass in `templates/backoffice`

## 3. Integration

- [x] 3.1 Run typecheck/lint and `npm run verify:quick`; verify it passes
- [x] 3.2 Confirm the CLI-generated project still replaces the placeholder (`npm test --prefix cli`)
