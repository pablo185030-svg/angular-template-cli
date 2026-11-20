import { match, strictEqual } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { makeTempDir } from '../support/test-helpers.js';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'scripts', 'verify-templates.mjs');

/** Builds a fake template whose scripts run `ok.js` (exit 0) or `fail.js` (exit 1), ignoring extra args. */
async function fakeTemplates(outcomes) {
  const root = await makeTempDir();
  const dir = join(root, 'templates', 'demo');
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'ok.js'), 'process.exit(0);\n');
  await writeFile(join(dir, 'fail.js'), 'process.exit(1);\n');
  const scripts = Object.fromEntries(Object.entries(outcomes).map(([name, ok]) => [name, `node ${ok ? 'ok' : 'fail'}.js`]));
  await writeFile(join(dir, 'package.json'), JSON.stringify({ name: 'demo', scripts }));
  return join(root, 'templates');
}

const verify = (templatesDir, ...args) =>
  spawnSync(process.execPath, [SCRIPT, '--templates-dir', templatesDir, '--skip-cli', ...args], { encoding: 'utf8' });

test('exits non-zero and names the step when a template step fails', async () => {
  const templatesDir = await fakeTemplates({ lint: true, test: false });

  const result = verify(templatesDir, '--only', 'lint,test');

  strictEqual(result.status, 1);
  match(result.stderr, /verify failed: demo: test/);
});

test('exits zero when every step passes', async () => {
  const templatesDir = await fakeTemplates({ lint: true, test: true });

  const result = verify(templatesDir, '--only', 'lint,test');

  strictEqual(result.status, 0);
  match(result.stdout, /verify passed: demo/);
});

test('fails when the requested template does not exist', async () => {
  const templatesDir = await fakeTemplates({});

  const result = verify(templatesDir, '--template', 'nope');

  strictEqual(result.status, 1);
  match(result.stderr, /no template found named "nope"/);
});
