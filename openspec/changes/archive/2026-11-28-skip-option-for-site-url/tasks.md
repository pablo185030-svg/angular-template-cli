# Tasks

## 1. Skip option

- [x] 1.1 Add a select step (`siteUrlChoice`: enter now / skip for now) before the `siteUrl` step in `cli/src/wizard.js`; the text step applies only when entering; verify with `node --test cli/test/site-url.test.js`.
- [x] 1.2 Update the website prompt sequences in the tests and add tests for the skip option and going back from the text prompt; verify with `npm test --prefix cli`.
- [x] 1.3 Run `npm run verify:quick`; it passes.
