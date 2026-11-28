import { deepStrictEqual, match, ok, rejects, strictEqual } from 'node:assert';
import { access, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import { run as realRun } from '../src/run.js';
import { buildSummary } from '../src/ui.js';
import { validateSiteUrl } from '../src/validate.js';
import { UsageError, resolveOptions } from '../src/wizard.js';
import { fakePrompts, makeTempDir, makeTemplates } from '../support/test-helpers.js';

const run = (argv, deps = {}) => realRun(argv, { defaultOutDir: deps.cwd, ...deps });
const exists = (path) => access(path).then(() => true, () => false);

async function setup() {
  const root = await makeTempDir();
  const templatesDir = await makeTemplates(root);
  const cwd = join(root, 'work');
  await mkdir(cwd);
  const output = [];
  return { cwd, templatesDir, output, write: (line) => output.push(line), runGit: () => {} };
}

test('validateSiteUrl accepts an http(s) origin and rejects anything else', () => {
  strictEqual(validateSiteUrl('https://www.mi-sitio.com'), undefined);
  strictEqual(validateSiteUrl('http://localhost:4200'), undefined);
  for (const bad of ['', undefined, 'mi-sitio.com', 'ftp://mi-sitio.com', 'https://mi-sitio.com/ruta', 'https://mi-sitio.com?x=1']) {
    strictEqual(typeof validateSiteUrl(bad), 'string', String(bad));
  }
});

test('the public site asks for the domain after the rendering mode; empty keeps the placeholder', async () => {
  const answers = ['public', 'my-site', '/w', false, 'ssr', '', false, true, false];
  const prompts = fakePrompts(answers);

  const result = await resolveOptions({ flags: {}, interactive: true, prompts });

  ok(!('siteUrl' in result));
  const question = prompts.asked[5];
  match(question.message, /Dominio de producción/);
  strictEqual(question.validate(''), undefined, 'empty is allowed');
  strictEqual(typeof question.validate('mi-sitio.com'), 'string');
  strictEqual(question.validate('https://www.mi-sitio.com'), undefined);
});

test('the domain question says it can wait, and explains itself for SPA', async () => {
  const ask = async (mode) => {
    const prompts = fakePrompts(['public', 'my-site', '/w', false, mode, '', false, true, false]);
    await resolveOptions({ flags: {}, interactive: true, prompts });
    return prompts.asked[5].message;
  };

  const ssr = await ask('ssr');
  const spa = await ask('spa');

  match(ssr, /Dominio de producción para el SEO/);
  match(ssr, /Enter sin escribir nada lo saltea, pero hace falta antes del build de producción/);
  ok(!/SPA/.test(ssr));
  match(spa, /Aunque un SPA tiene SEO limitado, el sitio igual publica canonical, sitemap y metadatos/);
  match(spa, /Enter sin escribir nada lo saltea/);
});

test('a typed domain is trimmed and returned', async () => {
  const prompts = fakePrompts(['public', 'my-site', '/w', false, 'ssr', '  https://www.mi-sitio.com ', false, true, false]);

  const result = await resolveOptions({ flags: {}, interactive: true, prompts });

  strictEqual(result.siteUrl, 'https://www.mi-sitio.com');
});

test('--site-url answers the question; without a terminal and without the flag nothing is asked', async () => {
  const prompts = fakePrompts([]);

  const flagged = await resolveOptions({
    flags: { type: 'public', name: 'a-b', siteUrl: 'https://www.mi-sitio.com' },
    interactive: false,
    prompts,
  });
  const quiet = await resolveOptions({ flags: { type: 'public', name: 'a-b' }, interactive: false, prompts });

  strictEqual(flagged.siteUrl, 'https://www.mi-sitio.com');
  ok(!('siteUrl' in quiet));
  strictEqual(prompts.asked.length, 0);
});

test('--site-url is rejected when invalid or used with the backoffice, and the backoffice is never asked', async () => {
  const attempt = (flags) => resolveOptions({ flags, interactive: false, prompts: fakePrompts([]) });

  await rejects(attempt({ type: 'public', name: 'a-b', siteUrl: 'no-es-una-url' }), UsageError);
  await rejects(attempt({ type: 'backoffice', name: 'a-b', siteUrl: 'https://www.mi-sitio.com' }), UsageError);
  await rejects(
    resolveOptions({ flags: { siteUrl: 'https://www.mi-sitio.com' }, interactive: true, prompts: fakePrompts(['backoffice', 'a-b']) }),
    UsageError,
  );

  const prompts = fakePrompts(['backoffice', 'my-admin', '/w', '', false, false, true, false, false, true, false]);
  await resolveOptions({ flags: {}, interactive: true, prompts });
  ok(!prompts.asked.some((question) => /Dominio de producción/.test(question.message)));
});

test('--site-url configures the generated project as a reported step', async () => {
  const { cwd, templatesDir, output, write, runGit } = await setup();

  const code = await run(['--type', 'public', '--name', 'my-site', '--yes', '--site-url', 'https://www.mi-sitio.com'], {
    templatesDir, cwd, write, isTTY: false, runGit,
  });

  strictEqual(code, 0);
  const text = output.join('\n');
  match(text, /Configurando el dominio \(https:\/\/www\.mi-sitio\.com\)\.\.\. listo/);
  match(text, /Dominio del sitio: https:\/\/www\.mi-sitio\.com\. Agregá el hostname a ssr\.allowedHosts/);
  const project = join(cwd, 'my-site');
  match(await readFile(join(project, 'src', 'environments', 'environment.prod.ts'), 'utf8'), /siteUrl: 'https:\/\/www\.mi-sitio\.com'/);
  for (const file of ['robots.txt', 'sitemap.xml', 'llms.txt']) {
    const content = await readFile(join(project, 'public', file), 'utf8');
    ok(!/example\.com/.test(content), file);
  }
});

test('without a domain no step runs and the summary warns about the build', async () => {
  const { cwd, templatesDir, output, write, runGit } = await setup();

  await run(['--type', 'public', '--name', 'my-site', '--yes'], { templatesDir, cwd, write, isTTY: false, runGit });

  const text = output.join('\n');
  ok(!/Configurando el dominio/.test(text));
  match(text, /Dominio sin configurar/);
  match(text, /npm run configure:seo -- --site-url/);
});

test('a bad --site-url writes nothing and exits with a usage error', async () => {
  const { cwd, templatesDir, write } = await setup();

  const code = await run(['--type', 'public', '--name', 'my-site', '--yes', '--site-url', 'mi-sitio.com'], {
    templatesDir, cwd, write, isTTY: false,
  });

  strictEqual(code, 2);
  strictEqual(await exists(join(cwd, 'my-site')), false);
});

test('the summary mentions the domain only for the public site, and skips allowedHosts outside SSR', () => {
  const base = { name: 'a-b', targetDir: '/x/a-b' };
  const ssr = buildSummary({ ...base, type: 'public', rendering: 'ssr', siteUrl: 'https://x.test' }).lines.join('\n');
  const ssg = buildSummary({ ...base, type: 'public', rendering: 'ssg', siteUrl: 'https://x.test' }).lines.join('\n');
  const backoffice = buildSummary({ ...base, type: 'backoffice' }).lines.join('\n');

  match(ssr, /allowedHosts/);
  ok(!/allowedHosts/.test(ssg));
  match(ssg, /Dominio del sitio: https:\/\/x\.test/);
  ok(!/Dominio/.test(backoffice));
  deepStrictEqual(backoffice.includes('configure:seo'), false);
});
