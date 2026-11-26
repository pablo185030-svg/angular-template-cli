import { deepStrictEqual, match, rejects, strictEqual } from 'node:assert';
import { test } from 'node:test';
import { CancelledError, UsageError, resolveOptions } from '../src/wizard.js';
import { CANCEL, fakePrompts } from '../support/test-helpers.js';

const LOC = '/work';
/** Remote: no, initial commit: yes, install: no. */
const TAIL = [false, true, false];
const INTERACTIVE = { outDir: LOC, commit: true, install: false };
const QUIET = { commit: false, install: false };

test('prompts for both values when no flags are given', async () => {
  const prompts = fakePrompts(['public', 'my-shop', LOC, false, 'ssr', ...TAIL]);

  const result = await resolveOptions({ flags: {}, interactive: true, prompts });

  deepStrictEqual(result, { type: 'public', name: 'my-shop', darkMode: false, rendering: 'ssr', ...INTERACTIVE });
  strictEqual(prompts.asked.length, 8);
});

test('does not prompt for values given as flags', async () => {
  const prompts = fakePrompts(['my-shop', LOC, false, 'ssr', ...TAIL]);

  const result = await resolveOptions({ flags: { type: 'public' }, interactive: true, prompts });

  deepStrictEqual(result, { type: 'public', name: 'my-shop', darkMode: false, rendering: 'ssr', ...INTERACTIVE });
  strictEqual(prompts.asked.length, 7);
});

test('the name prompt validates inline so the user can correct it', async () => {
  const prompts = fakePrompts(['public', 'ok-name', LOC, false, 'ssr', ...TAIL]);
  await resolveOptions({ flags: {}, interactive: true, prompts });

  const { validate } = prompts.asked[1];

  strictEqual(typeof validate('Bad Name'), 'string');
  strictEqual(validate('good-name'), undefined);
});

test('cancelling any prompt throws CancelledError', async () => {
  await rejects(
    resolveOptions({ flags: {}, interactive: true, prompts: fakePrompts([CANCEL]) }),
    CancelledError,
  );
  await rejects(
    resolveOptions({ flags: {}, interactive: true, prompts: fakePrompts(['public', CANCEL]) }),
    CancelledError,
  );
});

test('without a terminal, both flags are required', async () => {
  await rejects(resolveOptions({ flags: { type: 'public' }, interactive: false, prompts: fakePrompts([]) }), UsageError);
  const result = await resolveOptions({ flags: { type: 'public', name: 'a-b' }, interactive: false, prompts: fakePrompts([]) });
  deepStrictEqual(result, { type: 'public', name: 'a-b', darkMode: false, rendering: 'ssr', ...QUIET });
});

test('rejects an invalid flag value even when interactive', async () => {
  await rejects(resolveOptions({ flags: { name: 'Bad Name' }, interactive: true, prompts: fakePrompts([]) }), UsageError);
  await rejects(resolveOptions({ flags: { type: 'mobile' }, interactive: true, prompts: fakePrompts([]) }), UsageError);
});

const KC = { url: 'https://sso.example.com', realm: 'my-realm', clientId: 'my-admin' };

test('backoffice: asks whether to configure Keycloak and collects the three values', async () => {
  const prompts = fakePrompts(['backoffice', 'my-admin', LOC, true, KC.url, KC.realm, KC.clientId, true, false, ...TAIL]);

  const result = await resolveOptions({ flags: {}, interactive: true, prompts });

  deepStrictEqual(result, { type: 'backoffice', name: 'my-admin', mockApi: true, darkMode: false, keycloak: KC, ...INTERACTIVE });
  strictEqual(prompts.asked[6].initialValue, 'my-admin', 'client id defaults to the project name');
});

test('backoffice: declining Keycloak returns no settings and asks nothing else', async () => {
  const prompts = fakePrompts(['backoffice', 'my-admin', LOC, false, true, false, ...TAIL]);

  const result = await resolveOptions({ flags: {}, interactive: true, prompts });

  deepStrictEqual(result, { type: 'backoffice', name: 'my-admin', mockApi: true, darkMode: false, ...INTERACTIVE });
  strictEqual(prompts.asked.length, 9, 'type, name, location, Keycloak, mock API, dark mode, remote, commit, install');
});

test('public: never asks about Keycloak', async () => {
  const prompts = fakePrompts(['public', 'my-site', LOC, false, 'ssr', ...TAIL]);

  const result = await resolveOptions({ flags: {}, interactive: true, prompts });

  deepStrictEqual(result, { type: 'public', name: 'my-site', darkMode: false, rendering: 'ssr', ...INTERACTIVE });
  strictEqual(prompts.asked.length, 8, 'no Keycloak or mock API questions');
});

test('Keycloak prompts validate inline', async () => {
  const prompts = fakePrompts(['backoffice', 'my-admin', LOC, true, KC.url, KC.realm, KC.clientId, true, false, ...TAIL]);
  await resolveOptions({ flags: {}, interactive: true, prompts });

  strictEqual(typeof prompts.asked[3].validate, 'undefined');
  strictEqual(typeof prompts.asked[4].validate('not a url'), 'string');
  strictEqual(prompts.asked[4].validate('https://sso.example.com'), undefined);
  strictEqual(typeof prompts.asked[5].validate('my realm'), 'string');
  strictEqual(prompts.asked[5].validate('my-realm'), undefined);
});

test('cancelling inside the Keycloak questions throws CancelledError', async () => {
  await rejects(
    resolveOptions({ flags: {}, interactive: true, prompts: fakePrompts(['backoffice', 'a-b', LOC, CANCEL]) }),
    CancelledError,
  );
  await rejects(
    resolveOptions({ flags: {}, interactive: true, prompts: fakePrompts(['backoffice', 'a-b', LOC, true, CANCEL]) }),
    CancelledError,
  );
});

test('Keycloak flags skip the questions; client id defaults to the project name', async () => {
  const prompts = fakePrompts([]);
  const flags = { type: 'backoffice', name: 'my-admin', keycloakUrl: KC.url, keycloakRealm: KC.realm };

  const result = await resolveOptions({ flags, interactive: false, prompts });

  deepStrictEqual(result, { type: 'backoffice', name: 'my-admin', mockApi: true, darkMode: false, keycloak: KC, ...QUIET });
  strictEqual(prompts.asked.length, 0);
});

test('Keycloak flags are rejected when incomplete, invalid, or used with a public site', async () => {
  const base = { type: 'backoffice', name: 'my-admin' };
  const attempt = (flags) => resolveOptions({ flags, interactive: false, prompts: fakePrompts([]) });

  await rejects(attempt({ ...base, keycloakUrl: KC.url }), UsageError);
  await rejects(attempt({ ...base, keycloakUrl: 'not a url', keycloakRealm: 'r' }), UsageError);
  await rejects(attempt({ ...base, keycloakRealm: 'r' }), UsageError);
  await rejects(attempt({ type: 'public', name: 'my-site', keycloakUrl: KC.url, keycloakRealm: 'r' }), UsageError);
});

test('without a terminal and without Keycloak flags, the backoffice is left in demo mode', async () => {
  const result = await resolveOptions({ flags: { type: 'backoffice', name: 'a-b' }, interactive: false, prompts: fakePrompts([]) });

  deepStrictEqual(result, { type: 'backoffice', name: 'a-b', mockApi: true, darkMode: false, ...QUIET });
});

test('backoffice: the mock API question explains what it is and defaults to yes', async () => {
  const prompts = fakePrompts(['backoffice', 'my-admin', LOC, false, true, false, ...TAIL]);

  await resolveOptions({ flags: {}, interactive: true, prompts });

  const question = prompts.asked[4];
  strictEqual(question.initialValue, true);
  match(question.message, /API mock/);
  match(question.message, /sin backend/);
  match(question.message, /servidor local/);
  match(question.message, /products\.json/);
  match(question.message, /se pierden al recargar/);
});

test('backoffice: declining the mock API is reported as mockApi false', async () => {
  const prompts = fakePrompts(['backoffice', 'my-admin', LOC, false, false, false, ...TAIL]);

  const result = await resolveOptions({ flags: {}, interactive: true, prompts });

  strictEqual(result.mockApi, false);
});

test('the dark mode question defaults to no, and yes is reported as darkMode true', async () => {
  const declined = fakePrompts(['public', 'my-site', LOC, false, 'ssr', ...TAIL]);
  const accepted = fakePrompts(['public', 'my-site', LOC, true, 'ssr', ...TAIL]);

  await resolveOptions({ flags: {}, interactive: true, prompts: declined });
  const result = await resolveOptions({ flags: {}, interactive: true, prompts: accepted });

  strictEqual(declined.asked[3].initialValue, false);
  match(declined.asked[3].message, /modo oscuro/);
  strictEqual(result.darkMode, true);
});

test('--no-mock-api and --dark-mode skip their questions', async () => {
  const prompts = fakePrompts([]);
  const flags = { type: 'backoffice', name: 'my-admin', mockApi: false, darkMode: true };

  const result = await resolveOptions({ flags, interactive: true, prompts: fakePrompts([LOC, false, ...TAIL]) });
  const quiet = await resolveOptions({ flags, interactive: false, prompts });

  strictEqual(result.mockApi, false);
  strictEqual(result.darkMode, true);
  deepStrictEqual(quiet, { type: 'backoffice', name: 'my-admin', mockApi: false, darkMode: true, ...QUIET });
  strictEqual(prompts.asked.length, 0);
});

test('--no-mock-api is rejected for a public site', async () => {
  await rejects(
    resolveOptions({ flags: { type: 'public', name: 'a-b', mockApi: false }, interactive: false, prompts: fakePrompts([]) }),
    UsageError,
  );
  await rejects(
    resolveOptions({ flags: { mockApi: false }, interactive: true, prompts: fakePrompts(['public', 'a-b']) }),
    UsageError,
  );
});

test('cancelling the mock API or dark mode question throws CancelledError', async () => {
  await rejects(
    resolveOptions({ flags: {}, interactive: true, prompts: fakePrompts(['backoffice', 'a-b', LOC, false, CANCEL]) }),
    CancelledError,
  );
  await rejects(
    resolveOptions({ flags: {}, interactive: true, prompts: fakePrompts(['public', 'a-b', LOC, CANCEL]) }),
    CancelledError,
  );
});
