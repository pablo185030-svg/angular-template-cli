import { deepStrictEqual, rejects, strictEqual } from 'node:assert';
import { test } from 'node:test';
import { CancelledError, UsageError, resolveOptions } from '../src/wizard.js';
import { CANCEL, fakePrompts } from '../support/test-helpers.js';

test('prompts for both values when no flags are given', async () => {
  const prompts = fakePrompts(['public', 'my-shop']);

  const result = await resolveOptions({ flags: {}, interactive: true, prompts });

  deepStrictEqual(result, { type: 'public', name: 'my-shop' });
  strictEqual(prompts.asked.length, 2);
});

test('does not prompt for values given as flags', async () => {
  const prompts = fakePrompts(['my-shop']);

  const result = await resolveOptions({ flags: { type: 'public' }, interactive: true, prompts });

  deepStrictEqual(result, { type: 'public', name: 'my-shop' });
  strictEqual(prompts.asked.length, 1);
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
  deepStrictEqual(result, { type: 'public', name: 'a-b' });
});

test('rejects an invalid flag value even when interactive', async () => {
  await rejects(resolveOptions({ flags: { name: 'Bad Name' }, interactive: true, prompts: fakePrompts([]) }), UsageError);
  await rejects(resolveOptions({ flags: { type: 'mobile' }, interactive: true, prompts: fakePrompts([]) }), UsageError);
});

const KC = { url: 'https://sso.example.com', realm: 'my-realm', clientId: 'my-admin' };

test('backoffice: asks whether to configure Keycloak and collects the three values', async () => {
  const prompts = fakePrompts(['backoffice', 'my-admin', true, KC.url, KC.realm, KC.clientId]);

  const result = await resolveOptions({ flags: {}, interactive: true, prompts });

  deepStrictEqual(result, { type: 'backoffice', name: 'my-admin', keycloak: KC });
  strictEqual(prompts.asked[5].initialValue, 'my-admin', 'client id defaults to the project name');
});

test('backoffice: declining Keycloak returns no settings and asks nothing else', async () => {
  const prompts = fakePrompts(['backoffice', 'my-admin', false]);

  const result = await resolveOptions({ flags: {}, interactive: true, prompts });

  deepStrictEqual(result, { type: 'backoffice', name: 'my-admin' });
  strictEqual(prompts.asked.length, 3);
});

test('public: never asks about Keycloak', async () => {
  const prompts = fakePrompts(['public', 'my-site']);

  const result = await resolveOptions({ flags: {}, interactive: true, prompts });

  deepStrictEqual(result, { type: 'public', name: 'my-site' });
  strictEqual(prompts.asked.length, 2);
});

test('Keycloak prompts validate inline', async () => {
  const prompts = fakePrompts(['backoffice', 'my-admin', true, KC.url, KC.realm, KC.clientId]);
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

  deepStrictEqual(result, { type: 'backoffice', name: 'my-admin', keycloak: KC });
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

  deepStrictEqual(result, { type: 'backoffice', name: 'a-b' });
});
