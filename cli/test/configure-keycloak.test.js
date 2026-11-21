import { match, ok, rejects, strictEqual } from 'node:assert';
import { cp, mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { makeTempDir } from '../support/test-helpers.js';
import { applyKeycloakSettings, validateKeycloakSettings } from '../../templates/backoffice/scripts/configure-keycloak.mjs';

const REAL = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'templates', 'backoffice', 'src', 'environments');
const SETTINGS = { url: 'https://sso.example.com', realm: 'corp', clientId: 'my-app' };

async function project() {
  const dir = await makeTempDir();
  await mkdir(join(dir, 'src', 'environments'), { recursive: true });
  for (const file of ['environment.ts', 'environment.prod.ts', 'environment.e2e.ts']) {
    await cp(join(REAL, file), join(dir, 'src', 'environments', file));
  }
  return dir;
}

const read = (dir, file) => readFile(join(dir, 'src', 'environments', file), 'utf8');

test('the template ships in demo mode for local development', async () => {
  const dev = await readFile(join(REAL, 'environment.ts'), 'utf8');
  const prod = await readFile(join(REAL, 'environment.prod.ts'), 'utf8');

  match(dev, /mode: 'mock'/);
  match(prod, /mode: 'keycloak'/);
});

test('writes the settings to dev and prod and switches dev to Keycloak', async () => {
  const dir = await project();

  await applyKeycloakSettings(dir, SETTINGS);

  const dev = await read(dir, 'environment.ts');
  const prod = await read(dir, 'environment.prod.ts');
  for (const source of [dev, prod]) {
    match(source, /url: 'https:\/\/sso\.example\.com'/);
    match(source, /realm: 'corp'/);
    match(source, /clientId: 'my-app'/);
  }
  match(dev, /mode: 'keycloak'/);
  match(prod, /mode: 'keycloak'/);
});

test('leaves the e2e environment on the mock so e2e never needs Keycloak', async () => {
  const dir = await project();
  const before = await read(dir, 'environment.e2e.ts');

  await applyKeycloakSettings(dir, SETTINGS);

  strictEqual(await read(dir, 'environment.e2e.ts'), before);
  match(before, /mode: 'mock'/);
});

test('keeps apiBaseUrl and the rest of the file untouched, and can run twice', async () => {
  const dir = await project();

  await applyKeycloakSettings(dir, SETTINGS);
  await applyKeycloakSettings(dir, { ...SETTINGS, realm: 'other' });

  const dev = await read(dir, 'environment.ts');
  match(dev, /apiBaseUrl: '\/api'/);
  match(dev, /realm: 'other'/);
  ok(!/realm: 'corp'/.test(dev));
  strictEqual((dev.match(/mode: '(mock|keycloak)'/g) ?? []).length, 1);
});

test('rejects invalid settings without touching any file', async () => {
  const dir = await project();
  const before = await read(dir, 'environment.ts');

  for (const bad of [
    { ...SETTINGS, url: 'sso.example.com' },
    { ...SETTINGS, url: "https://x.com/'; evil" },
    { ...SETTINGS, realm: '' },
    { ...SETTINGS, realm: 'a/b' },
    { ...SETTINGS, clientId: 'has space' },
  ]) {
    await rejects(applyKeycloakSettings(dir, bad));
  }

  strictEqual(await read(dir, 'environment.ts'), before);
});

test('validateKeycloakSettings accepts good values', () => {
  strictEqual(validateKeycloakSettings(SETTINGS), undefined);
  strictEqual(validateKeycloakSettings({ ...SETTINGS, url: 'http://localhost:8080' }), undefined);
});
