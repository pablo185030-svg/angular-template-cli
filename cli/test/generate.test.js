import { deepStrictEqual, match, rejects, strictEqual } from 'node:assert';
import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  assertNoPlaceholders,
  assertTargetAvailable,
  copyTemplate,
  addEnvironments,
  configureKeycloak,
  generateProject,
  replacePlaceholders,
} from '../src/generate.js';
import { makeTempDir, makeTemplates } from '../support/test-helpers.js';

const exists = (path) => access(path).then(() => true, () => false);
const runStep = async (_label, action) => action();

test('copies a template without node_modules and build output', async () => {
  const root = await makeTempDir();
  const templates = await makeTemplates(root);
  const target = join(root, 'out');

  await copyTemplate(join(templates, 'public'), target);

  deepStrictEqual((await readdir(target)).sort(), ['logo.bin', 'package.json', 'scripts', 'src']);
});

test('replaces the placeholder in text files and leaves binary files untouched', async () => {
  const root = await makeTempDir();
  const templates = await makeTemplates(root);
  const target = join(root, 'out');
  await copyTemplate(join(templates, 'public'), target);

  const changed = await replacePlaceholders(target, 'my-shop');

  strictEqual(changed, 2);
  strictEqual(JSON.parse(await readFile(join(target, 'package.json'), 'utf8')).name, 'my-shop');
  match(await readFile(join(target, 'src', 'index.html'), 'utf8'), /<title>my-shop<\/title>/);
  const binary = await readFile(join(target, 'logo.bin'));
  strictEqual(binary.includes(Buffer.from('coto-angular-template')), true);
});

test('fails when a placeholder is left behind', async () => {
  const root = await makeTempDir();
  await writeFile(join(root, 'left.txt'), 'still coto-angular-template here');

  await rejects(assertNoPlaceholders(root, 'my-shop'), /No se reemplazó por completo/);
});

test('accepts a directory that does not exist yet and an empty one', async () => {
  const root = await makeTempDir();
  await assertTargetAvailable(join(root, 'missing'));
  await mkdir(join(root, 'empty'));
  await assertTargetAvailable(join(root, 'empty'));
});

test('rejects a non-empty target directory and does not modify it', async () => {
  const root = await makeTempDir();
  const templates = await makeTemplates(root);
  const target = join(root, 'taken');
  await mkdir(target);
  await writeFile(join(target, 'keep.txt'), 'mine');

  await rejects(
    generateProject({ templateDir: join(templates, 'public'), targetDir: target, projectName: 'taken', runStep }),
    /ya existe y no está vacío/,
  );

  deepStrictEqual(await readdir(target), ['keep.txt']);
  strictEqual(await readFile(join(target, 'keep.txt'), 'utf8'), 'mine');
});

test('fails clearly when the template folder is missing', async () => {
  const root = await makeTempDir();

  await rejects(
    generateProject({ templateDir: join(root, 'nope'), targetDir: join(root, 'out'), projectName: 'x', runStep }),
    /No se encontró el template/,
  );
  strictEqual(await exists(join(root, 'out')), false);
});

test('generates a project and initializes git on main with no history', async () => {
  const root = await makeTempDir();
  const templates = await makeTemplates(root);
  const target = join(root, 'my-shop');
  const labels = [];

  await generateProject({
    templateDir: join(templates, 'backoffice'),
    targetDir: target,
    projectName: 'my-shop',
    runStep: async (label, action) => {
      labels.push(label);
      await action();
    },
  });

  strictEqual(labels.length, 4);
  strictEqual(await exists(join(target, '.git')), true);
  strictEqual((await readFile(join(target, '.git', 'HEAD'), 'utf8')).trim(), 'ref: refs/heads/main');
  strictEqual(await exists(join(target, 'node_modules')), false);
  strictEqual(await exists(join(target, 'dist')), false);
});

test('uses path APIs only: works with a target inside a path with spaces', async () => {
  const root = await makeTempDir();
  const templates = await makeTemplates(root);
  const target = join(root, 'dir with spaces', 'my-shop');

  await generateProject({ templateDir: join(templates, 'public'), targetDir: target, projectName: 'my-shop', runStep });

  strictEqual(JSON.parse(await readFile(join(target, 'package.json'), 'utf8')).name, 'my-shop');
});

test('creates the extra environments, then configures each environment through the project script', async () => {
  const root = await makeTempDir();
  const templates = await makeTemplates(root);
  const calls = [];

  await generateProject({
    templateDir: join(templates, 'backoffice'),
    targetDir: join(root, 'out'),
    projectName: 'my-admin',
    runStep,
    runGit: () => {},
    environments: ['qa'],
    keycloak: {
      qa: { url: 'https://qa.example.com', realm: 'r', clientId: 'my-admin' },
      prod: { url: 'https://sso.example.com', realm: 'r2', clientId: 'my-admin' },
    },
    runNode: (args) => calls.push(args),
  });

  deepStrictEqual(calls, [
    ['scripts/configure-keycloak.mjs', '--add-env', 'qa'],
    ['scripts/configure-keycloak.mjs', '--env', 'qa', '--url', 'https://qa.example.com', '--realm', 'r', '--client-id', 'my-admin'],
    ['scripts/configure-keycloak.mjs', '--env', 'prod', '--url', 'https://sso.example.com', '--realm', 'r2', '--client-id', 'my-admin'],
  ]);
});

test('runs one script call per environment', () => {
  const calls = [];
  addEnvironments('/x', ['dev', 'qa'], (args) => calls.push(args[2]));
  configureKeycloak('/x', {}, (args) => calls.push(args));
  deepStrictEqual(calls, ['dev', 'qa']);
});
