import { deepStrictEqual, match, ok, rejects, strictEqual } from 'node:assert';
import { test } from 'node:test';
import { CancelledError, UsageError, resolveOptions } from '../src/wizard.js';
import { CANCEL, fakePrompts } from '../support/test-helpers.js';

const LOC = '/work';
/** Remote: no, initial commit: yes, install: no, Angular skill: no. */
const TAIL = [false, true, false, false];
const INTERACTIVE = { outDir: LOC, commit: true, install: false, angularSkill: false };
const QUIET = { commit: false, install: false, angularSkill: false };

test('prompts for both values when no flags are given', async () => {
  const prompts = fakePrompts(['website', 'my-shop', LOC, false, 'ssr', 'skip', ...TAIL]);

  const result = await resolveOptions({ flags: {}, interactive: true, prompts });

  deepStrictEqual(result, { type: 'website', name: 'my-shop', darkMode: false, rendering: 'ssr', ...INTERACTIVE });
  strictEqual(prompts.asked.length, 10);
});

test('does not prompt for values given as flags', async () => {
  const prompts = fakePrompts(['my-shop', LOC, false, 'ssr', 'skip', ...TAIL]);

  const result = await resolveOptions({ flags: { type: 'website' }, interactive: true, prompts });

  deepStrictEqual(result, { type: 'website', name: 'my-shop', darkMode: false, rendering: 'ssr', ...INTERACTIVE });
  strictEqual(prompts.asked.length, 9);
});

test('the name prompt validates inline so the user can correct it', async () => {
  const prompts = fakePrompts(['website', 'ok-name', LOC, false, 'ssr', ...TAIL]);
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
    resolveOptions({ flags: {}, interactive: true, prompts: fakePrompts(['website', CANCEL]) }),
    CancelledError,
  );
});

test('without a terminal, both flags are required', async () => {
  await rejects(resolveOptions({ flags: { type: 'website' }, interactive: false, prompts: fakePrompts([]) }), UsageError);
  const result = await resolveOptions({ flags: { type: 'website', name: 'a-b' }, interactive: false, prompts: fakePrompts([]) });
  deepStrictEqual(result, { type: 'website', name: 'a-b', darkMode: false, rendering: 'ssr', ...QUIET });
});

test('rejects an invalid flag value even when interactive', async () => {
  await rejects(resolveOptions({ flags: { name: 'Bad Name' }, interactive: true, prompts: fakePrompts([]) }), UsageError);
  await rejects(resolveOptions({ flags: { type: 'mobile' }, interactive: true, prompts: fakePrompts([]) }), UsageError);
});

const KC = { url: 'https://sso.example.com', realm: 'my-realm', clientId: 'my-admin' };

test('backoffice: asks whether to configure Keycloak and collects the three values', async () => {
  const prompts = fakePrompts(['backoffice', 'my-admin', LOC, '', true, KC.url, KC.realm, KC.clientId, false, true, false, ...TAIL]);

  const result = await resolveOptions({ flags: {}, interactive: true, prompts });

  deepStrictEqual(result, { type: 'backoffice', name: 'my-admin', mockApi: true, environments: [], darkMode: false, keycloak: { local: KC }, ...INTERACTIVE });
  strictEqual(prompts.asked[7].initialValue, 'my-admin', 'client id defaults to the project name');
});

test('backoffice: declining Keycloak returns no settings and asks nothing else', async () => {
  const prompts = fakePrompts(['backoffice', 'my-admin', LOC, '', false, false, true, false, ...TAIL]);

  const result = await resolveOptions({ flags: {}, interactive: true, prompts });

  deepStrictEqual(result, { type: 'backoffice', name: 'my-admin', mockApi: true, environments: [], darkMode: false, ...INTERACTIVE });
  strictEqual(prompts.asked.length, 12, 'type, name, location, environments, Keycloak local and prod, mock API, dark mode, remote, commit, install, Angular skill');
});

test('public: never asks about Keycloak', async () => {
  const prompts = fakePrompts(['website', 'my-site', LOC, false, 'ssr', 'skip', ...TAIL]);

  const result = await resolveOptions({ flags: {}, interactive: true, prompts });

  deepStrictEqual(result, { type: 'website', name: 'my-site', darkMode: false, rendering: 'ssr', ...INTERACTIVE });
  strictEqual(prompts.asked.length, 10, 'no Keycloak or mock API questions');
});

test('Keycloak prompts validate inline', async () => {
  const prompts = fakePrompts(['backoffice', 'my-admin', LOC, '', true, KC.url, KC.realm, KC.clientId, false, true, false, ...TAIL]);
  await resolveOptions({ flags: {}, interactive: true, prompts });

  strictEqual(typeof prompts.asked[4].validate, 'undefined');
  strictEqual(typeof prompts.asked[5].validate('not a url'), 'string');
  strictEqual(prompts.asked[5].validate('https://sso.example.com'), undefined);
  strictEqual(typeof prompts.asked[6].validate('my realm'), 'string');
  strictEqual(prompts.asked[6].validate('my-realm'), undefined);
});

test('cancelling inside the Keycloak questions throws CancelledError', async () => {
  await rejects(
    resolveOptions({ flags: {}, interactive: true, prompts: fakePrompts(['backoffice', 'a-b', LOC, '', CANCEL]) }),
    CancelledError,
  );
  await rejects(
    resolveOptions({ flags: {}, interactive: true, prompts: fakePrompts(['backoffice', 'a-b', LOC, '', true, CANCEL]) }),
    CancelledError,
  );
});

test('Keycloak flags skip the questions; client id defaults to the project name', async () => {
  const prompts = fakePrompts([]);
  const flags = { type: 'backoffice', name: 'my-admin', keycloakUrl: KC.url, keycloakRealm: KC.realm };

  const result = await resolveOptions({ flags, interactive: false, prompts });

  deepStrictEqual(result, { type: 'backoffice', name: 'my-admin', mockApi: true, environments: [], darkMode: false, keycloak: { local: KC, prod: KC }, ...QUIET });
  strictEqual(prompts.asked.length, 0);
});

test('Keycloak flags are rejected when incomplete, invalid, or used with a public site', async () => {
  const base = { type: 'backoffice', name: 'my-admin' };
  const attempt = (flags) => resolveOptions({ flags, interactive: false, prompts: fakePrompts([]) });

  await rejects(attempt({ ...base, keycloakUrl: KC.url }), UsageError);
  await rejects(attempt({ ...base, keycloakUrl: 'not a url', keycloakRealm: 'r' }), UsageError);
  await rejects(attempt({ ...base, keycloakRealm: 'r' }), UsageError);
  await rejects(attempt({ type: 'website', name: 'my-site', keycloakUrl: KC.url, keycloakRealm: 'r' }), UsageError);
});

test('without a terminal and without Keycloak flags, the backoffice is left in demo mode', async () => {
  const result = await resolveOptions({ flags: { type: 'backoffice', name: 'a-b' }, interactive: false, prompts: fakePrompts([]) });

  deepStrictEqual(result, { type: 'backoffice', name: 'a-b', mockApi: true, environments: [], darkMode: false, ...QUIET });
});

test('backoffice: the mock API question explains what it is and defaults to yes', async () => {
  const prompts = fakePrompts(['backoffice', 'my-admin', LOC, '', false, false, true, false, ...TAIL]);

  await resolveOptions({ flags: {}, interactive: true, prompts });

  const question = prompts.asked[6];
  strictEqual(question.initialValue, true);
  match(question.message, /API mock/);
  match(question.message, /sin backend/);
  match(question.message, /servidor local/);
  match(question.message, /products\.json/);
  match(question.message, /se pierden al recargar/);
});

test('backoffice: declining the mock API is reported as mockApi false', async () => {
  const prompts = fakePrompts(['backoffice', 'my-admin', LOC, '', false, false, false, false, ...TAIL]);

  const result = await resolveOptions({ flags: {}, interactive: true, prompts });

  strictEqual(result.mockApi, false);
});

test('the dark mode question defaults to no, and yes is reported as darkMode true', async () => {
  const declined = fakePrompts(['website', 'my-site', LOC, false, 'ssr', ...TAIL]);
  const accepted = fakePrompts(['website', 'my-site', LOC, true, 'ssr', ...TAIL]);

  await resolveOptions({ flags: {}, interactive: true, prompts: declined });
  const result = await resolveOptions({ flags: {}, interactive: true, prompts: accepted });

  strictEqual(declined.asked[3].initialValue, false);
  match(declined.asked[3].message, /modo oscuro/);
  strictEqual(result.darkMode, true);
});

test('--no-mock-api and --dark-mode skip their questions', async () => {
  const prompts = fakePrompts([]);
  const flags = { type: 'backoffice', name: 'my-admin', mockApi: false, darkMode: true };

  const result = await resolveOptions({ flags, interactive: true, prompts: fakePrompts([LOC, '', false, false, ...TAIL]) });
  const quiet = await resolveOptions({ flags, interactive: false, prompts });

  strictEqual(result.mockApi, false);
  strictEqual(result.darkMode, true);
  deepStrictEqual(quiet, { type: 'backoffice', name: 'my-admin', mockApi: false, environments: [], darkMode: true, ...QUIET });
  strictEqual(prompts.asked.length, 0);
});

test('--no-mock-api is rejected for a public site', async () => {
  await rejects(
    resolveOptions({ flags: { type: 'website', name: 'a-b', mockApi: false }, interactive: false, prompts: fakePrompts([]) }),
    UsageError,
  );
  await rejects(
    resolveOptions({ flags: { mockApi: false }, interactive: true, prompts: fakePrompts(['website', 'a-b']) }),
    UsageError,
  );
});

test('cancelling the mock API or dark mode question throws CancelledError', async () => {
  await rejects(
    resolveOptions({ flags: {}, interactive: true, prompts: fakePrompts(['backoffice', 'a-b', LOC, '', false, false, CANCEL]) }),
    CancelledError,
  );
  await rejects(
    resolveOptions({ flags: {}, interactive: true, prompts: fakePrompts(['website', 'a-b', LOC, '', CANCEL]) }),
    CancelledError,
  );
});

const KC_QA = { url: 'https://sso-qa.example.com', realm: 'qa-realm', clientId: 'my-admin' };

test('backoffice: asks Keycloak per environment, chaining defaults from the previous one', async () => {
  const prompts = fakePrompts([
    'backoffice', 'my-admin', LOC, 'qa',
    false,
    true, KC_QA.url, KC_QA.realm, KC_QA.clientId,
    true, KC.url, KC.realm, KC.clientId,
    true, false, ...TAIL,
  ]);

  const result = await resolveOptions({ flags: {}, interactive: true, prompts });

  deepStrictEqual(result.environments, ['qa']);
  deepStrictEqual(result.keycloak, { qa: KC_QA, prod: KC });
  const messages = prompts.asked.map((question) => question.message);
  ok(messages.some((message) => /para local/.test(message)));
  ok(messages.some((message) => /\[qa\] URL/.test(message)));
  const prodUrl = prompts.asked.find((question) => /\[prod\] URL/.test(question.message));
  strictEqual(prodUrl.initialValue, KC_QA.url, 'defaults to the closest configured environment');
  const prodWanted = prompts.asked.find((question) => /Keycloak para prod/.test(question.message));
  strictEqual(prodWanted.initialValue, true);
});

test('the environments question validates names inline', async () => {
  const prompts = fakePrompts(['backoffice', 'my-admin', LOC, 'dev, qa', false, false, false, true, false, ...TAIL]);

  const result = await resolveOptions({ flags: {}, interactive: true, prompts });

  deepStrictEqual(result.environments, ['dev', 'qa']);
  const { validate } = prompts.asked[3];
  strictEqual(validate(''), undefined);
  strictEqual(typeof validate('QA'), 'string');
  strictEqual(typeof validate('e2e'), 'string');
  strictEqual(typeof validate('prod'), 'string');
  strictEqual(typeof validate('qa, qa'), 'string');
});

test('--environments and --keycloak flags configure each environment without questions', async () => {
  const flags = {
    type: 'backoffice',
    name: 'my-admin',
    environments: 'qa',
    keycloak: [`prod=${KC.url},${KC.realm}`, `qa=${KC_QA.url},${KC_QA.realm},custom`],
  };

  const result = await resolveOptions({ flags, interactive: false, prompts: fakePrompts([]) });

  deepStrictEqual(result.environments, ['qa']);
  deepStrictEqual(result.keycloak, { prod: KC, qa: { ...KC_QA, clientId: 'custom' } });
});

test('legacy Keycloak flags apply to every environment', async () => {
  const flags = { type: 'backoffice', name: 'my-admin', environments: 'dev', keycloakUrl: KC.url, keycloakRealm: KC.realm };

  const result = await resolveOptions({ flags, interactive: false, prompts: fakePrompts([]) });

  deepStrictEqual(Object.keys(result.keycloak), ['local', 'dev', 'prod']);
  deepStrictEqual(result.keycloak.dev, KC);
});

test('environment flags are rejected when invalid, mixed with the legacy ones, or with a public site', async () => {
  const base = { type: 'backoffice', name: 'my-admin' };
  const attempt = (flags) => resolveOptions({ flags, interactive: false, prompts: fakePrompts([]) });

  await rejects(attempt({ ...base, environments: 'QA' }), UsageError);
  await rejects(attempt({ ...base, environments: 'e2e' }), UsageError);
  await rejects(attempt({ ...base, environments: 'qa,qa' }), UsageError);
  await rejects(attempt({ ...base, keycloak: ['qa=https://x.com,r'] }), UsageError, 'unknown environment');
  await rejects(attempt({ ...base, keycloak: ['bad-format'] }), UsageError);
  await rejects(attempt({ ...base, keycloak: ['prod=nourl,r'] }), UsageError);
  await rejects(attempt({ ...base, keycloak: [`prod=${KC.url},r`, `prod=${KC.url},r`] }), UsageError);
  await rejects(attempt({ ...base, keycloak: [`prod=${KC.url},r`], keycloakUrl: KC.url, keycloakRealm: 'r' }), UsageError);
  await rejects(attempt({ type: 'website', name: 'my-site', environments: 'qa' }), UsageError);
  await rejects(attempt({ type: 'website', name: 'my-site', keycloak: [`prod=${KC.url},r`] }), UsageError);
});

test('the Angular skill question defaults to no and its flag skips it', async () => {
  const prompts = fakePrompts(['website', 'my-shop', LOC, false, 'ssr', 'skip', false, true, false, true]);
  const asked = await resolveOptions({ flags: {}, interactive: true, prompts });
  strictEqual(asked.angularSkill, true);
  const question = prompts.asked.at(-1);
  strictEqual(question.initialValue, false);
  match(question.message, /angular-developer/);

  const flagged = fakePrompts(['website', 'my-shop', LOC, false, 'ssr', 'skip', false, true, false]);
  const result = await resolveOptions({ flags: { angularSkill: true }, interactive: true, prompts: flagged });
  strictEqual(result.angularSkill, true);
  strictEqual(flagged.asked.length, 9);
});
