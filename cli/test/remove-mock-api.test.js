import { match, ok, rejects, strictEqual } from 'node:assert';
import { access, cp, mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { makeTempDir } from '../support/test-helpers.js';
import { removeMockApi } from '../../templates/backoffice/scripts/remove-mock-api.mjs';

const TEMPLATE = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'templates', 'backoffice');

async function project() {
  const dir = await makeTempDir();
  await mkdir(join(dir, 'src'), { recursive: true });
  await cp(join(TEMPLATE, 'src', 'environments'), join(dir, 'src', 'environments'), { recursive: true });
  await cp(join(TEMPLATE, 'mock'), join(dir, 'mock'), { recursive: true });
  for (const file of ['playwright.config.ts', 'angular.json', 'package.json', 'proxy.conf.json']) {
    await cp(join(TEMPLATE, file), join(dir, file));
  }
  return dir;
}

const exists = (path) => access(path).then(() => true, () => false);

test('the template ships using the HTTP API', async () => {
  const dev = await readFile(join(TEMPLATE, 'src', 'environments', 'environment.ts'), 'utf8');

  match(dev, /mode: 'http'/);
});

test('switches dev and e2e to the JSON source and keeps production on HTTP', async () => {
  const dir = await project();

  await removeMockApi(dir);

  for (const file of ['environment.ts', 'environment.e2e.ts']) {
    match(await readFile(join(dir, 'src', 'environments', file), 'utf8'), /mode: 'json'/);
  }
  match(await readFile(join(dir, 'src', 'environments', 'environment.prod.ts'), 'utf8'), /mode: 'http'/);
});

test('removes the mock server, the proxy and their configuration', async () => {
  const dir = await project();

  await removeMockApi(dir);

  strictEqual(await exists(join(dir, 'mock', 'server.mjs')), false);
  strictEqual(await exists(join(dir, 'proxy.conf.json')), false);
  const pkg = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'));
  strictEqual(pkg.scripts['mock:api'], undefined);
  strictEqual(pkg.scripts['remove:mock-api'], undefined);
  ok(pkg.scripts['configure:keycloak']);
  const playwright = await readFile(join(dir, 'playwright.config.ts'), 'utf8');
  ok(!playwright.includes('mock:api'));
  match(playwright, /npm run start:e2e/);
  const angular = JSON.parse(await readFile(join(dir, 'angular.json'), 'utf8'));
  strictEqual(angular.projects['coto-angular-template'].architect.serve.options.proxyConfig, undefined);
});

test('fails loudly when an expected block is missing', async () => {
  const dir = await project();
  await removeMockApi(dir);

  await rejects(removeMockApi(dir), /Could not find/);
});
