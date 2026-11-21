import { deepStrictEqual, match, ok, rejects, strictEqual } from 'node:assert';
import { access, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import { run as realRun } from '../src/run.js';
import { buildSummary } from '../src/ui.js';
import { UsageError, resolveOptions } from '../src/wizard.js';
import { addRenderingFiles, fakePrompts, makeTempDir, makeTemplates } from '../support/test-helpers.js';

const run = (argv, deps = {}) => realRun(argv, { defaultOutDir: deps.cwd, ...deps });
const exists = (path) => access(path).then(() => true, () => false);

async function setup() {
  const root = await makeTempDir();
  const templatesDir = await makeTemplates(root);
  await addRenderingFiles(join(templatesDir, 'public'));
  const cwd = join(root, 'work');
  await mkdir(cwd);
  const output = [];
  return { cwd, templatesDir, output, write: (line) => output.push(line), runGit: () => {} };
}

test('the public site asks the rendering mode, SSR by default, with a warning about SPA', async () => {
  const prompts = fakePrompts(['public', 'my-site', '/w', false, 'ssg', false, true, false]);

  const result = await resolveOptions({ flags: {}, interactive: true, prompts });

  strictEqual(result.rendering, 'ssg');
  const question = prompts.asked[4];
  strictEqual(question.initialValue, 'ssr');
  deepStrictEqual(question.options.map((option) => option.value), ['ssr', 'ssg', 'spa']);
  match(question.options.find((option) => option.value === 'spa').hint, /sin SEO/);
});

test('the backoffice never asks the rendering mode', async () => {
  const prompts = fakePrompts(['backoffice', 'my-admin', '/w', false, true, false, false, true, false]);

  const result = await resolveOptions({ flags: {}, interactive: true, prompts });

  ok(!('rendering' in result));
  ok(!prompts.asked.some((question) => /renderizar/.test(question.message)));
});

test('--rendering answers the question; without a terminal the default is ssr', async () => {
  const prompts = fakePrompts([]);

  const flagged = await resolveOptions({ flags: { type: 'public', name: 'a-b', rendering: 'spa' }, interactive: false, prompts });
  const quiet = await resolveOptions({ flags: { type: 'public', name: 'a-b' }, interactive: false, prompts });

  strictEqual(flagged.rendering, 'spa');
  strictEqual(quiet.rendering, 'ssr');
  strictEqual(prompts.asked.length, 0);
});

test('--rendering is rejected when invalid or used with the backoffice', async () => {
  const attempt = (flags, answers = []) =>
    resolveOptions({ flags, interactive: false, prompts: fakePrompts(answers) });

  await rejects(attempt({ type: 'public', name: 'a-b', rendering: 'hybrid' }), UsageError);
  await rejects(attempt({ type: 'backoffice', name: 'a-b', rendering: 'ssg' }), UsageError);
  await rejects(
    resolveOptions({ flags: { rendering: 'ssg' }, interactive: true, prompts: fakePrompts(['backoffice', 'a-b']) }),
    UsageError,
  );
});

test('--rendering ssg converts the generated project as a reported step', async () => {
  const { cwd, templatesDir, output, write, runGit } = await setup();

  const code = await run(['--type', 'public', '--name', 'my-site', '--yes', '--rendering', 'ssg'], {
    templatesDir, cwd, write, isTTY: false, runGit,
  });

  strictEqual(code, 0);
  const text = output.join('\n');
  match(text, /Configurando el renderizado \(SSG\)\.\.\. listo/);
  match(text, /Renderizado: SSG/);
  const project = join(cwd, 'my-site');
  match(await readFile(join(project, 'angular.json'), 'utf8'), /"outputMode": "static"/);
  match(await readFile(join(project, 'Dockerfile'), 'utf8'), /dist\/my-site\/browser/);
  ok(!/coto-angular-template/.test(await readFile(join(project, 'angular.json'), 'utf8')));
});

test('--rendering spa removes the server files', async () => {
  const { cwd, templatesDir, write, runGit } = await setup();

  strictEqual(
    await run(['--type', 'public', '--name', 'my-site', '--yes', '--rendering', 'spa'], { templatesDir, cwd, write, isTTY: false, runGit }),
    0,
  );

  strictEqual(await exists(join(cwd, 'my-site', 'src', 'server.ts')), false);
});

test('by default the public site stays SSR, with no conversion step', async () => {
  const { cwd, templatesDir, output, write, runGit } = await setup();

  await run(['--type', 'public', '--name', 'my-site', '--yes'], { templatesDir, cwd, write, isTTY: false, runGit });

  const text = output.join('\n');
  ok(!/renderizado/i.test(text.split('Próximos pasos')[0]), 'a conversion step ran');
  match(text, /Renderizado: SSR/);
  match(text, /npm run configure:rendering -- --mode ssg/);
  match(await readFile(join(cwd, 'my-site', 'src', 'server.ts'), 'utf8'), /express/);
});

test('a bad --rendering value writes nothing and exits with a usage error', async () => {
  const { cwd, templatesDir, write } = await setup();

  const code = await run(['--type', 'public', '--name', 'my-site', '--yes', '--rendering', 'hybrid'], { templatesDir, cwd, write, isTTY: false });

  strictEqual(code, 2);
  strictEqual(await exists(join(cwd, 'my-site')), false);
});

test('the summary mentions the rendering mode only for the public site', () => {
  const base = { name: 'a-b', targetDir: '/x/a-b' };
  const ssr = buildSummary({ ...base, type: 'public', rendering: 'ssr' }).lines.join('\n');
  const spa = buildSummary({ ...base, type: 'public', rendering: 'spa' }).lines.join('\n');
  const backoffice = buildSummary({ ...base, type: 'backoffice' }).lines.join('\n');

  match(ssr, /npm run configure:rendering/);
  match(spa, /Renderizado: SPA/);
  ok(!/Renderizado/.test(backoffice));
});
