import { match, ok, strictEqual } from 'node:assert';
import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { run as realRun, DEFAULT_OUT_DIR } from '../src/run.js';
import { buildSummary } from '../src/ui.js';
import { CANCEL, fakePrompts, makeTempDir, makeTemplates } from '../support/test-helpers.js';

// Tests write into a temp dir: unless a test says otherwise, projects go to `cwd`.
const run = (argv, deps = {}) => realRun(argv, { defaultOutDir: deps.cwd, ...deps });

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
  const prompts = fakePrompts(['backoffice', 'admin-panel', cwd, false, true, false, false, true, false]);

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

test('by default the project is created next to this repository, not inside it', () => {
  const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

  strictEqual(DEFAULT_OUT_DIR, dirname(repoRoot));
  ok(!DEFAULT_OUT_DIR.startsWith(`${repoRoot}/`), 'default output is inside the repository');
});

test('relative --out is resolved from the current directory', async () => {
  const { cwd, templatesDir, write } = await setup();

  const code = await run(['--type', 'public', '--name', 'my-shop', '--yes', '--out', 'sub'], { templatesDir, cwd, write, isTTY: false });

  strictEqual(code, 0);
  strictEqual(await exists(join(cwd, 'sub', 'my-shop', 'package.json')), true);
});

test('backoffice with Keycloak flags writes the settings and switches to Keycloak', async () => {
  const { cwd, templatesDir, output, write } = await setup();

  const code = await run(
    ['--type', 'backoffice', '--name', 'my-admin', '--yes', '--keycloak-url', 'https://sso.example.com', '--keycloak-realm', 'corp'],
    { templatesDir, cwd, write, isTTY: false },
  );

  strictEqual(code, 0);
  const dev = await readFile(join(cwd, 'my-admin', 'src', 'environments', 'environment.ts'), 'utf8');
  const prod = await readFile(join(cwd, 'my-admin', 'src', 'environments', 'environment.prod.ts'), 'utf8');
  for (const source of [dev, prod]) {
    match(source, /url: 'https:\/\/sso\.example\.com'/);
    match(source, /realm: 'corp'/);
    match(source, /clientId: 'my-admin'/);
  }
  match(dev, /mode: 'keycloak'/);
  const text = output.join('\n');
  match(text, /Configurando Keycloak\.\.\. listo/);
  match(text, /Keycloak configurado/);
});

test('backoffice without Keycloak stays in demo mode and the summary says how to connect it later', async () => {
  const { cwd, templatesDir, output, write } = await setup();

  const code = await run(['--type', 'backoffice', '--name', 'my-admin', '--yes'], { templatesDir, cwd, write, isTTY: false });

  strictEqual(code, 0);
  const dev = await readFile(join(cwd, 'my-admin', 'src', 'environments', 'environment.ts'), 'utf8');
  match(dev, /mode: 'mock'/);
  const text = output.join('\n');
  ok(!/Configurando Keycloak/.test(text));
  match(text, /modo demo/);
  match(text, /npm run configure:keycloak/);
});

test('the public summary does not mention Keycloak', async () => {
  const { cwd, templatesDir, output, write } = await setup();

  await run(['--type', 'public', '--name', 'my-shop', '--yes'], { templatesDir, cwd, write, isTTY: false });

  ok(!/Keycloak/.test(output.join('\n')));
});

test('a failing Keycloak step is reported and exits non-zero', async () => {
  const { cwd, templatesDir, output, write } = await setup();

  const code = await run(
    ['--type', 'backoffice', '--name', 'my-admin', '--yes', '--keycloak-url', 'https://sso.example.com', '--keycloak-realm', 'corp'],
    { templatesDir, cwd, write, isTTY: false, runNode: () => { throw new Error('boom'); } },
  );

  strictEqual(code, 1);
  match(output.join('\n'), /Configurando Keycloak\.\.\. FALLÓ/);
});

test('the summary tells the user where to cd, relative to the current directory', async () => {
  const { cwd, templatesDir, output, write } = await setup();

  await run(['--type', 'public', '--name', 'my-shop', '--yes'], { templatesDir, cwd, write, isTTY: false });

  match(output.join('\n'), /cd my-shop/);
});

test('the summary uses the absolute path when the relative one climbs too far, and quotes spaces', async () => {
  const { root, templatesDir, write, output } = await setup();
  const deep = join(root, 'a', 'b', 'c', 'd');
  await mkdir(deep, { recursive: true });
  const out = join(root, 'dir with spaces');

  await run(['--type', 'public', '--name', 'my-shop', '--yes', '--out', out], { templatesDir, cwd: deep, write, isTTY: false });

  match(output.join('\n'), new RegExp(`cd "${join(out, 'my-shop').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
});

async function generated(argv) {
  const { cwd, templatesDir, output, write } = await setup();
  const code = await run(argv, { templatesDir, cwd, write, isTTY: false });
  const read = (...parts) => readFile(join(cwd, argv[3], ...parts), 'utf8');
  return { code, output: output.join('\n'), read, dir: join(cwd, argv[3]) };
}

test('by default the backoffice keeps the mock API and is light only', async () => {
  const { code, output, read, dir } = await generated(['--type', 'backoffice', '--name', 'my-admin', '--yes']);

  strictEqual(code, 0);
  strictEqual(await exists(join(dir, 'mock', 'server.mjs')), true);
  match(await read('package.json'), /"mock:api"/);
  match(await read('src', 'environments', 'environment.ts'), /mode: 'http'/);
  match(await read('src', 'environments', 'environment.ts'), /darkMode: false/);
  ok(!/Quitando la API mock|Habilitando el modo oscuro/.test(output));
  match(output, /npm run mock:api/);
  match(output, /Solo tema claro/);
});

test('--no-mock-api removes the mock API and switches the products example to JSON', async () => {
  const { code, output, read, dir } = await generated(['--type', 'backoffice', '--name', 'my-admin', '--yes', '--no-mock-api']);

  strictEqual(code, 0);
  strictEqual(await exists(join(dir, 'mock')), false);
  strictEqual(await exists(join(dir, 'proxy.conf.json')), false);
  ok(!/"mock:api"/.test(await read('package.json')));
  ok(!/mock:api/.test(await read('playwright.config.ts')));
  match(await read('src', 'environments', 'environment.ts'), /mode: 'json'/);
  match(output, /Quitando la API mock\.\.\. listo/);
  match(output, /Sin API mock/);
  ok(!/npm run mock:api/.test(output));
});

test('--dark-mode enables dark mode in a public site and in a backoffice', async () => {
  for (const type of ['public', 'backoffice']) {
    const { code, output, read } = await generated(['--type', type, '--name', 'my-app', '--yes', '--dark-mode']);

    strictEqual(code, 0, type);
    match(await read('src', 'environments', 'environment.ts'), /darkMode: true/);
    match(output, /Habilitando el modo oscuro\.\.\. listo/);
    match(output, /Modo oscuro habilitado/);
  }
});

test('--no-mock-api with a public site exits non-zero and writes nothing', async () => {
  const { cwd, templatesDir, output, write } = await setup();

  const code = await run(['--type', 'public', '--name', 'my-shop', '--yes', '--no-mock-api'], { templatesDir, cwd, write, isTTY: false });

  strictEqual(code, 2);
  match(output.join('\n'), /--no-mock-api/);
  strictEqual(await exists(join(cwd, 'my-shop')), false);
});

test('the help lists the new flags', async () => {
  const { cwd, templatesDir, output, write } = await setup();

  await run(['--help'], { templatesDir, cwd, write, isTTY: false });

  match(output.join('\n'), /--no-mock-api/);
  match(output.join('\n'), /--dark-mode/);
});
