import { deepStrictEqual, match, rejects, strictEqual } from 'node:assert';
import { test } from 'node:test';
import { CancelledError, UsageError, resolveOptions } from '../src/wizard.js';
import { CANCEL, fakePrompts } from '../support/test-helpers.js';

test('prompts for both values when no flags are given', async () => {
  const prompts = fakePrompts(['public', 'my-shop', false]);

  const result = await resolveOptions({ flags: {}, interactive: true, prompts });

  deepStrictEqual(result, { type: 'public', name: 'my-shop', darkMode: false });
  strictEqual(prompts.asked.length, 3);
});

test('does not prompt for values given as flags', async () => {
  const prompts = fakePrompts(['my-shop', false]);

  const result = await resolveOptions({ flags: { type: 'public' }, interactive: true, prompts });

  deepStrictEqual(result, { type: 'public', name: 'my-shop', darkMode: false });
  strictEqual(prompts.asked.length, 2);
});

test('the name prompt validates inline so the user can correct it', async () => {
  const prompts = fakePrompts(['public', 'ok-name']);
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
  deepStrictEqual(result, { type: 'public', name: 'a-b', darkMode: false });
});

test('rejects an invalid flag value even when interactive', async () => {
  await rejects(resolveOptions({ flags: { name: 'Bad Name' }, interactive: true, prompts: fakePrompts([]) }), UsageError);
  await rejects(resolveOptions({ flags: { type: 'mobile' }, interactive: true, prompts: fakePrompts([]) }), UsageError);
});

const KC = { url: 'https://sso.example.com', realm: 'my-realm', clientId: 'my-admin' };

test('backoffice: asks whether to configure Keycloak and collects the three values', async () => {
  const prompts = fakePrompts(['backoffice', 'my-admin', true, KC.url, KC.realm, KC.clientId, true, false]);

  const result = await resolveOptions({ flags: {}, interactive: true, prompts });

  deepStrictEqual(result, { type: 'backoffice', name: 'my-admin', mockApi: true, darkMode: false, keycloak: KC });
  strictEqual(prompts.asked[5].initialValue, 'my-admin', 'client id defaults to the project name');
});

test('backoffice: declining Keycloak returns no settings and asks nothing else', async () => {
  const prompts = fakePrompts(['backoffice', 'my-admin', false, true, false]);

  const result = await resolveOptions({ flags: {}, interactive: true, prompts });

  deepStrictEqual(result, { type: 'backoffice', name: 'my-admin', mockApi: true, darkMode: false });
  strictEqual(prompts.asked.length, 5, 'type, name, Keycloak, mock API, dark mode');
});

test('public: never asks about Keycloak', async () => {
  const prompts = fakePrompts(['public', 'my-site', false]);

  const result = await resolveOptions({ flags: {}, interactive: true, prompts });

  deepStrictEqual(result, { type: 'public', name: 'my-site', darkMode: false });
  strictEqual(prompts.asked.length, 3, 'type, name, dark mode: no Keycloak or mock API');
});

test('Keycloak prompts validate inline', async () => {
  const prompts = fakePrompts(['backoffice', 'my-admin', true, KC.url, KC.realm, KC.clientId, true, false]);
  await resolveOptions({ flags: {}, interactive: true, prompts });

  strictEqual(typeof prompts.asked[2].validate, 'undefined');
  strictEqual(typeof prompts.asked[3].validate('not a url'), 'string');
  strictEqual(prompts.asked[3].validate('https://sso.example.com'), undefined);
  strictEqual(typeof prompts.asked[4].validate('my realm'), 'string');
  strictEqual(prompts.asked[4].validate('my-realm'), undefined);
});

test('cancelling inside the Keycloak questions throws CancelledError', async () => {
  await rejects(
    resolveOptions({ flags: {}, interactive: true, prompts: fakePrompts(['backoffice', 'a-b', CANCEL]) }),
    CancelledError,
  );
  await rejects(
    resolveOptions({ flags: {}, interactive: true, prompts: fakePrompts(['backoffice', 'a-b', true, CANCEL]) }),
    CancelledError,
  );
});

test('Keycloak flags skip the questions; client id defaults to the project name', async () => {
  const prompts = fakePrompts([]);
  const flags = { type: 'backoffice', name: 'my-admin', keycloakUrl: KC.url, keycloakRealm: KC.realm };

  const result = await resolveOptions({ flags, interactive: false, prompts });

  deepStrictEqual(result, { type: 'backoffice', name: 'my-admin', mockApi: true, darkMode: false, keycloak: KC });
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

  deepStrictEqual(result, { type: 'backoffice', name: 'a-b', mockApi: true, darkMode: false });
});

test('backoffice: the mock API question explains what it is and defaults to yes', async () => {
  const prompts = fakePrompts(['backoffice', 'my-admin', false, true, false]);

  await resolveOptions({ flags: {}, interactive: true, prompts });

  const question = prompts.asked[3];
  strictEqual(question.initialValue, true);
  match(question.message, /API mock/);
  match(question.message, /sin backend/);
  match(question.message, /solo un mock, no una API real/);
  match(question.message, /JSON/);
  match(question.message, /memoria del navegador/);
});

test('backoffice: declining the mock API is reported as mockApi false', async () => {
  const prompts = fakePrompts(['backoffice', 'my-admin', false, false, false]);

  const result = await resolveOptions({ flags: {}, interactive: true, prompts });

  strictEqual(result.mockApi, false);
});

test('the dark mode question defaults to no, and yes is reported as darkMode true', async () => {
  const declined = fakePrompts(['public', 'my-site', false]);
  const accepted = fakePrompts(['public', 'my-site', true]);

  await resolveOptions({ flags: {}, interactive: true, prompts: declined });
  const result = await resolveOptions({ flags: {}, interactive: true, prompts: accepted });

  strictEqual(declined.asked[2].initialValue, false);
  match(declined.asked[2].message, /modo oscuro/);
  strictEqual(result.darkMode, true);
});

test('--no-mock-api and --dark-mode skip their questions', async () => {
  const prompts = fakePrompts([]);
  const flags = { type: 'backoffice', name: 'my-admin', mockApi: false, darkMode: true };

  const result = await resolveOptions({ flags, interactive: true, prompts: fakePrompts([false]) });
  const quiet = await resolveOptions({ flags, interactive: false, prompts });

  strictEqual(result.mockApi, false);
  strictEqual(result.darkMode, true);
  deepStrictEqual(quiet, { type: 'backoffice', name: 'my-admin', mockApi: false, darkMode: true });
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
    resolveOptions({ flags: {}, interactive: true, prompts: fakePrompts(['backoffice', 'a-b', false, CANCEL]) }),
    CancelledError,
  );
  await rejects(
    resolveOptions({ flags: {}, interactive: true, prompts: fakePrompts(['public', 'a-b', CANCEL]) }),
    CancelledError,
  );
});
