import { deepStrictEqual, strictEqual } from 'node:assert';
import { test } from 'node:test';
import { parseEnvironments, parseKeycloakFlag, validateAppType, validateEnvironmentName, validateProjectName } from '../src/validate.js';

test('accepts kebab-case project names', () => {
  for (const name of ['shop', 'my-shop', 'app2', 'my-app-v2']) {
    strictEqual(validateProjectName(name), undefined, name);
  }
});

test('rejects invalid project names with a message', () => {
  const invalid = ['', '  ', undefined, 'My Shop', 'MyShop', 'my_shop', '2app', '-app', 'app-', 'a--b', '../x', 'a/b', 'a\\b'];
  for (const name of invalid) {
    strictEqual(typeof validateProjectName(name), 'string', String(name));
  }
});

test('validates the app type', () => {
  strictEqual(validateAppType('public'), undefined);
  strictEqual(validateAppType('backoffice'), undefined);
  strictEqual(typeof validateAppType('mobile'), 'string');
  strictEqual(typeof validateAppType(undefined), 'string');
});

test('environment names: kebab-case, not reserved', () => {
  for (const name of ['dev', 'qa', 'pre-prod', 'staging2']) strictEqual(validateEnvironmentName(name), undefined, name);
  for (const name of ['', 'QA', 'a b', 'e2e', 'local', 'prod', '-x', 'a--b']) {
    strictEqual(typeof validateEnvironmentName(name), 'string', name);
  }
});

test('parses the environment list and rejects repeats', () => {
  deepStrictEqual(parseEnvironments('dev, qa').names, ['dev', 'qa']);
  deepStrictEqual(parseEnvironments('').names, []);
  deepStrictEqual(parseEnvironments(undefined).names, []);
  strictEqual(typeof parseEnvironments('qa,qa').error, 'string');
  strictEqual(typeof parseEnvironments('prod').error, 'string');
});

test('parses --keycloak values', () => {
  deepStrictEqual(parseKeycloakFlag('qa=https://sso.example.com:8443,corp'), {
    env: 'qa',
    url: 'https://sso.example.com:8443',
    realm: 'corp',
  });
  deepStrictEqual(parseKeycloakFlag('qa=https://sso.example.com,corp,app').clientId, 'app');
  for (const bad of ['qa', '=https://x.com,r', 'qa=https://x.com', 'qa=a,b,c,d']) {
    strictEqual(typeof parseKeycloakFlag(bad).error, 'string', bad);
  }
});
