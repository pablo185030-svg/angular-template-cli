import { strictEqual } from 'node:assert';
import { test } from 'node:test';
import { validateAppType, validateProjectName } from '../src/validate.js';

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
