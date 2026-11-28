import { deepStrictEqual, match, ok, rejects, strictEqual } from 'node:assert';
import { cp, mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { makeTempDir } from '../support/test-helpers.js';
import { addEnvironment, applyKeycloakSettings, listEnvironments, validateEnvironmentName, validateKeycloakSettings } from '../../templates/backoffice/scripts/configure-keycloak.mjs';

const REAL = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'templates', 'backoffice', 'src', 'environments');
const SETTINGS = { url: 'https://sso.example.com', realm: 'corp', clientId: 'my-app' };

async function project() {
  const dir = await makeTempDir();
  await mkdir(join(dir, 'src', 'environments'), { recursive: true });
  for (const file of ['environment.ts', 'environment.prod.ts', 'environment.e2e.ts']) {
    await cp(join(REAL, file), join(dir, 'src', 'environments', file));
  }
  for (const file of ['angular.json', 'package.json']) {
    await cp(join(REAL, '..', '..', file), join(dir, file));
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

test('writes the settings to local and switches it to Keycloak', async () => {
  const dir = await project();

  await applyKeycloakSettings(dir, 'local', SETTINGS);

  const dev = await read(dir, 'environment.ts');
  match(dev, /issuer: 'https:\/\/sso\.example\.com\/realms\/corp'/);
  match(dev, /clientId: 'my-app'/);
  match(dev, /requireHttps: true/);
  match(dev, /mode: 'keycloak'/);
});

test('configuring one environment changes only its file', async () => {
  const dir = await project();
  const before = await Promise.all(['environment.ts', 'environment.e2e.ts'].map((f) => read(dir, f)));

  await applyKeycloakSettings(dir, 'prod', SETTINGS);

  const prod = await read(dir, 'environment.prod.ts');
  match(prod, /issuer: 'https:\/\/sso\.example\.com\/realms\/corp'/);
  match(prod, /mode: 'keycloak'/);
  strictEqual(await read(dir, 'environment.ts'), before[0]);
  strictEqual(await read(dir, 'environment.e2e.ts'), before[1]);
});

test('an http Keycloak does not require https', async () => {
  const dir = await project();

  await applyKeycloakSettings(dir, 'local', { ...SETTINGS, url: 'http://localhost:8080' });

  match(await read(dir, 'environment.ts'), /requireHttps: false/);
});

test('leaves the e2e environment on the mock so e2e never needs Keycloak', async () => {
  const dir = await project();
  const before = await read(dir, 'environment.e2e.ts');

  await applyKeycloakSettings(dir, 'prod', SETTINGS);
  await rejects(applyKeycloakSettings(dir, 'e2e', SETTINGS));

  strictEqual(await read(dir, 'environment.e2e.ts'), before);
  match(before, /mode: 'mock'/);
});

test('can run twice and keeps the rest of the file untouched', async () => {
  const dir = await project();

  await applyKeycloakSettings(dir, 'local', SETTINGS);
  await applyKeycloakSettings(dir, 'local', { ...SETTINGS, realm: 'other' });

  const dev = await read(dir, 'environment.ts');
  match(dev, /apiBaseUrl: '\/api'/);
  match(dev, /realms\/other'/);
  ok(!/realms\/corp'/.test(dev));
  strictEqual((dev.match(/mode: '(mock|keycloak)'/g) ?? []).length, 1);
});

test('rejects invalid settings and unknown environments without touching any file', async () => {
  const dir = await project();
  const before = await read(dir, 'environment.ts');

  for (const bad of [
    { ...SETTINGS, url: 'sso.example.com' },
    { ...SETTINGS, url: "https://x.com/'; evil" },
    { ...SETTINGS, realm: '' },
    { ...SETTINGS, realm: 'a/b' },
    { ...SETTINGS, clientId: 'has space' },
  ]) {
    await rejects(applyKeycloakSettings(dir, 'local', bad));
  }
  await rejects(applyKeycloakSettings(dir, 'qa', SETTINGS));

  strictEqual(await read(dir, 'environment.ts'), before);
});

test('addEnvironment creates the environment file, its configurations and scripts', async () => {
  const dir = await project();

  await addEnvironment(dir, 'qa');

  match(await read(dir, 'environment.qa.ts'), /envName: 'qa'/);
  match(await read(dir, 'environment.qa.ts'), /mode: 'keycloak'/);
  const angular = JSON.parse(await readFile(join(dir, 'angular.json'), 'utf8'));
  const { architect } = Object.values(angular.projects)[0];
  strictEqual(
    architect.build.configurations.qa.fileReplacements[0].with,
    'src/environments/environment.qa.ts',
  );
  strictEqual(architect.build.configurations.qa.outputHashing, 'all');
  match(architect.serve.configurations.qa.buildTarget, /:build:qa$/);
  const pkg = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'));
  strictEqual(pkg.scripts['build:qa'], 'ng build --configuration qa');
  deepStrictEqual(await listEnvironments(dir), ['local', 'prod', 'qa']);
  await applyKeycloakSettings(dir, 'qa', SETTINGS);
  match(await read(dir, 'environment.qa.ts'), /realms\/corp'/);
});

test('addEnvironment rejects bad, reserved and duplicate names', async () => {
  const dir = await project();
  for (const name of ['QA', 'e2e', 'local', 'prod', 'a b', '']) {
    await rejects(addEnvironment(dir, name));
  }
  await addEnvironment(dir, 'qa');
  await rejects(addEnvironment(dir, 'qa'));
  strictEqual(validateEnvironmentName('pre-prod'), undefined);
  strictEqual(typeof validateEnvironmentName('e2e'), 'string');
});

test('validateKeycloakSettings accepts good values', () => {
  strictEqual(validateKeycloakSettings(SETTINGS), undefined);
  strictEqual(validateKeycloakSettings({ ...SETTINGS, url: 'http://localhost:8080' }), undefined);
});
