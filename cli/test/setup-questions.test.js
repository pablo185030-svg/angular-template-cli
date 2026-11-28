import { deepStrictEqual, match, ok, strictEqual } from 'node:assert';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import { run as realRun } from '../src/run.js';
import { buildSummary, createPlainReporter } from '../src/ui.js';
import { validateRemoteUrl } from '../src/validate.js';
import { fakePrompts, makeTempDir, makeTemplates } from '../support/test-helpers.js';

const run = (argv, deps = {}) => realRun(argv, { defaultOutDir: deps.cwd, ...deps });

async function setup() {
  const root = await makeTempDir();
  const templatesDir = await makeTemplates(root);
  const cwd = join(root, 'work');
  await mkdir(cwd);
  const output = [];
  const gitCalls = [];
  const npmCalls = [];
  return {
    cwd,
    templatesDir,
    output,
    gitCalls,
    npmCalls,
    write: (line) => output.push(line),
    runGit: (args) => gitCalls.push(args.join(' ')),
    runNpm: (args, dir) => npmCalls.push({ args, dir }),
  };
}

const BASE = ['--type', 'website', '--name', 'my-site', '--yes'];

test('without flags nothing new happens: no remote, no commit, no install', async () => {
  const { cwd, templatesDir, write, runGit, runNpm, gitCalls, npmCalls, output } = await setup();

  strictEqual(await run(BASE, { templatesDir, cwd, write, isTTY: false, runGit, runNpm }), 0);

  deepStrictEqual(gitCalls, ['init -b main']);
  deepStrictEqual(npmCalls, []);
  match(output.join('\n'), /npm install/);
});

test('--remote adds origin without pushing and the summary shows the push command', async () => {
  const { cwd, templatesDir, write, runGit, runNpm, gitCalls, output } = await setup();

  const code = await run([...BASE, '--remote', 'git@github.com:org/my-site.git'], {
    templatesDir, cwd, write, isTTY: false, runGit, runNpm,
  });

  strictEqual(code, 0);
  deepStrictEqual(gitCalls, ['init -b main', 'remote add origin git@github.com:org/my-site.git']);
  ok(!gitCalls.some((call) => call.startsWith('push')));
  match(output.join('\n'), /git push -u origin main/);
});

test('--remote with spaces is rejected before writing anything', async () => {
  const { cwd, templatesDir, write, runGit, gitCalls } = await setup();

  const code = await run([...BASE, '--remote', 'not a url'], { templatesDir, cwd, write, isTTY: false, runGit });

  strictEqual(code, 2);
  deepStrictEqual(gitCalls, []);
});

test('--install runs npm install, before the initial commit, and the summary skips it', async () => {
  const { cwd, templatesDir, write, runGit, runNpm, gitCalls, npmCalls, output } = await setup();
  const order = [];

  const code = await run([...BASE, '--install'], {
    templatesDir, cwd, write, isTTY: false,
    runGit: (args, dir) => { order.push(`git ${args[0]}`); runGit(args, dir); },
    runNpm: (args, dir) => { order.push('npm'); runNpm(args, dir); },
  });

  strictEqual(code, 0);
  strictEqual(npmCalls.length, 1);
  deepStrictEqual(npmCalls[0].args, ['install']);
  deepStrictEqual(order, ['git init', 'npm']);
  ok(gitCalls.length === 1);
  const summary = output.join('\n');
  ok(!/^ {2}npm install$/m.test(summary), 'npm install is still listed as a next step');
});

test('a failing install is reported but does not abort and the summary lists npm install', async () => {
  const { cwd, templatesDir, write, runGit, output } = await setup();

  const code = await run([...BASE, '--install'], {
    templatesDir, cwd, write, isTTY: false, runGit,
    runNpm: () => { throw Object.assign(new Error('E401'), { stderr: 'npm ERR! 401 Unauthorized' }); },
  });

  strictEqual(code, 0);
  const text = output.join('\n');
  match(text, /Instalando dependencias.*AVISO.*401 Unauthorized/);
  match(text, /^ {2}npm install$/m);
});

test('the initial commit adds everything; a failing commit is only a warning', async () => {
  // Without a terminal the commit is off, so the commit itself is exercised through the guided flow.
  const { cwd, templatesDir, write, runGit, runNpm, gitCalls } = await setup();
  const prompts = fakePrompts(['website', 'my-site', cwd, false, 'ssr', '', false, true, false]);
  const reporterFactory = () => createPlainReporter(write);

  const code = await run([], { templatesDir, cwd, write, isTTY: true, prompts, reporterFactory, runGit, runNpm });

  strictEqual(code, 0);
  deepStrictEqual(gitCalls, ['init -b main', 'add -A', 'commit -m chore: initial commit']);

  const failing = await setup();
  const failCode = await run([], {
    templatesDir: failing.templatesDir,
    cwd: failing.cwd,
    write: failing.write,
    isTTY: true,
    prompts: fakePrompts(['website', 'my-site', failing.cwd, false, 'ssr', '', false, true, false]),
    reporterFactory: () => createPlainReporter(failing.write),
    runNpm: failing.runNpm,
    runGit: (args) => { if (args[0] === 'commit') throw new Error('no identity'); },
  });
  strictEqual(failCode, 0);
  match(failing.output.join('\n'), /commit inicial.*AVISO/);
});

test('--no-commit declines the commit even in the guided flow, without asking', async () => {
  const { cwd, templatesDir, write, runGit, runNpm, gitCalls } = await setup();
  const prompts = fakePrompts(['website', 'my-site', cwd, false, 'ssr', false, false, false]);

  await run(['--no-commit'], {
    templatesDir, cwd, write, isTTY: true, prompts, runGit, runNpm,
    reporterFactory: () => createPlainReporter(write),
  });

  deepStrictEqual(gitCalls, ['init -b main']);
  ok(!prompts.asked.some((question) => /commit inicial/.test(question.message)));
});

test('--install and --no-install together are rejected', async () => {
  const { cwd, templatesDir, write } = await setup();

  strictEqual(await run([...BASE, '--install', '--no-install'], { templatesDir, cwd, write, isTTY: false }), 1);
});

test('the guided flow asks the location (default: the sibling folder) and uses it', async () => {
  const { cwd, templatesDir, write, runGit, runNpm } = await setup();
  const elsewhere = join(cwd, 'elsewhere');
  const prompts = fakePrompts(['website', 'my-site', elsewhere, false, 'ssr', false, false, false]);

  const code = await run([], {
    templatesDir, cwd, write, isTTY: true, prompts, runGit, runNpm,
    reporterFactory: () => createPlainReporter(write),
  });

  strictEqual(code, 0);
  strictEqual(prompts.asked[2].initialValue, cwd, 'location defaults to the default output directory');
  const { access } = await import('node:fs/promises');
  await access(join(elsewhere, 'my-site', 'package.json'));
});

test('remote and install prompts explain themselves and validate', async () => {
  const { cwd, templatesDir, write, runGit, runNpm } = await setup();
  const prompts = fakePrompts(['website', 'my-site', cwd, false, 'ssr', '', true, 'git@h:o/r.git', false, true]);

  await run([], {
    templatesDir, cwd, write, isTTY: true, prompts, runGit, runNpm,
    reporterFactory: () => createPlainReporter(write),
  });

  const urlQuestion = prompts.asked.find((question) => /URL del repositorio/.test(question.message));
  strictEqual(typeof urlQuestion.validate('a b'), 'string');
  strictEqual(urlQuestion.validate('git@h:o/r.git'), undefined);
  const install = prompts.asked.at(-1);
  strictEqual(install.initialValue, false);
  match(install.message, /registry privado de @coto-dev\/ui-kit/);
});

test('validateRemoteUrl rejects empty values and spaces', () => {
  strictEqual(typeof validateRemoteUrl(''), 'string');
  strictEqual(typeof validateRemoteUrl('a b'), 'string');
  strictEqual(validateRemoteUrl('https://example.com/a.git'), undefined);
});

test('the summary leaves out npm install when installed and handles remote without a commit', () => {
  const base = { name: 'a-b', type: 'website', targetDir: '/x/a-b' };
  const installed = buildSummary({ ...base, installed: true }).lines.join('\n');
  const noCommit = buildSummary({ ...base, remote: 'u', committed: false }).lines.join('\n');
  const committed = buildSummary({ ...base, remote: 'u', committed: true }).lines.join('\n');

  ok(!/^ {2}npm install$/m.test(installed));
  match(noCommit, /Cuando hagas el primer commit: git push -u origin main/);
  match(committed, /Para publicar el código: git push -u origin main/);
  ok(!/git push/.test(buildSummary(base).lines.join('\n')));
});
