import { match, ok, strictEqual } from 'node:assert';
import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import { run } from '../src/run.js';
import { buildSummary } from '../src/ui.js';
import { CANCEL, fakePrompts, makeTempDir, makeTemplates } from '../support/test-helpers.js';

const exists = (path) => access(path).then(() => true, () => false);

async function setup() {
  const root = await makeTempDir();
  const templatesDir = await makeTemplates(root);
  const cwd = join(root, 'work');
  await mkdir(cwd);
  const output = [];
  return { root, cwd, templatesDir, output, write: (line) => output.push(line) };
}

test('generates a project from flags with plain output and no ANSI codes', async () => {
  const { cwd, templatesDir, output, write } = await setup();

  const code = await run(['--type', 'public', '--name', 'my-shop', '--yes'], {
    templatesDir, cwd, write, isTTY: true,
  });

  strictEqual(code, 0);
  strictEqual(JSON.parse(await readFile(join(cwd, 'my-shop', 'package.json'), 'utf8')).name, 'my-shop');
  const text = output.join('\n');
  ok(!/\u001b\[/.test(text), 'output has ANSI escape codes');
  match(text, /\[1\] Verificando el directorio de destino\.\.\. listo/);
  match(text, /npm install/);
  match(text, /registry privado/);
});

test('does not prompt without a terminal and fails when flags are missing', async () => {
  const { cwd, templatesDir, output, write } = await setup();

  const code = await run(['--type', 'public'], { templatesDir, cwd, write, isTTY: false });

  strictEqual(code, 2);
  match(output.join('\n'), /Faltan --type y\/o --name/);
  deepEqual(await readdir(cwd), []);
});

test('guided flow with prompts generates the chosen template', async () => {
  const { cwd, templatesDir, write } = await setup();
  const prompts = fakePrompts(['backoffice', 'admin-panel']);

  const code = await run([], {
    templatesDir, cwd, write, prompts, isTTY: true,
    reporterFactory: () => plainReporter(write),
  });

  strictEqual(code, 0);
  strictEqual(await exists(join(cwd, 'admin-panel', 'package.json')), true);
});

test('cancelling a prompt exits without writing anything', async () => {
  const { cwd, templatesDir, write } = await setup();
  const prompts = fakePrompts(['public', CANCEL]);

  const code = await run([], {
    templatesDir, cwd, write, prompts, isTTY: true,
    reporterFactory: () => plainReporter(write),
  });

  strictEqual(code, 130);
  deepEqual(await readdir(cwd), []);
});

test('an existing non-empty target exits non-zero and keeps its files', async () => {
  const { cwd, templatesDir, output, write } = await setup();
  await mkdir(join(cwd, 'my-shop'));
  await writeFile(join(cwd, 'my-shop', 'keep.txt'), 'mine');

  const code = await run(['--type', 'public', '--name', 'my-shop', '--yes'], { templatesDir, cwd, write, isTTY: false });

  strictEqual(code, 1);
  match(output.join('\n'), /ya existe y no está vacío/);
  strictEqual(await readFile(join(cwd, 'my-shop', 'keep.txt'), 'utf8'), 'mine');
});

test('an invalid name is rejected before anything is written', async () => {
  const { cwd, templatesDir, output, write } = await setup();

  const code = await run(['--type', 'public', '--name', 'My Shop', '--yes'], { templatesDir, cwd, write, isTTY: false });

  strictEqual(code, 2);
  match(output.join('\n'), /minúsculas/);
  deepEqual(await readdir(cwd), []);
});

test('a failing step is reported and exits non-zero', async () => {
  const { cwd, templatesDir, output, write } = await setup();

  const code = await run(['--type', 'public', '--name', 'my-shop', '--yes'], {
    templatesDir, cwd, write, isTTY: false,
    runGit: () => { throw new Error('git is not installed'); },
  });

  strictEqual(code, 1);
  const text = output.join('\n');
  match(text, /Inicializando el repositorio git\.\.\. FALLÓ/);
  match(text, /git is not installed/);
});

test('--out places the project in another parent directory', async () => {
  const { root, cwd, templatesDir, write } = await setup();

  const code = await run(['--type', 'public', '--name', 'my-shop', '--yes', '--out', join(root, 'elsewhere')], {
    templatesDir, cwd, write, isTTY: false,
  });

  strictEqual(code, 0);
  strictEqual(await exists(join(root, 'elsewhere', 'my-shop', 'package.json')), true);
});

test('unknown flags print usage and exit non-zero', async () => {
  const { templatesDir, output, write } = await setup();

  const code = await run(['--nope'], { templatesDir, write, isTTY: false });

  strictEqual(code, 1);
  match(output.join('\n'), /Uso:/);
});

test('the summary lists the mock API step only for the backoffice', () => {
  const backoffice = buildSummary({ name: 'a-b', type: 'backoffice', targetDir: '/x/a-b' }).lines.join('\n');
  const publicApp = buildSummary({ name: 'a-b', type: 'public', targetDir: '/x/a-b' }).lines.join('\n');

  match(backoffice, /npm run mock:api/);
  ok(!/mock:api/.test(publicApp));
});

function plainReporter(write) {
  let step = 0;
  return {
    intro() {},
    async runStep(label, action) { step++; await action(); write(`[${step}] ${label}`); },
    summary() {},
    cancelled() { write('cancelled'); },
    error(message) { write(`Error: ${message}`); },
  };
}

function deepEqual(actual, expected) {
  strictEqual(JSON.stringify(actual), JSON.stringify(expected));
}
