import { deepStrictEqual, match, strictEqual } from 'node:assert';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { makeTempDir } from '../support/test-helpers.js';
import { applySiteUrl } from '../../templates/public/scripts/configure-seo.mjs';
import { findPlaceholderUrls } from '../../templates/public/scripts/check-seo.mjs';

const TEMPLATE = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'templates', 'public');
const SCRIPT = join(TEMPLATE, 'scripts', 'check-seo.mjs');

/** A copy of the files the check reads, in the real template layout. */
async function project() {
  const dir = await makeTempDir();
  await mkdir(join(dir, 'scripts'), { recursive: true });
  await mkdir(join(dir, 'src'), { recursive: true });
  await cp(join(TEMPLATE, 'scripts', 'check-seo.mjs'), join(dir, 'scripts', 'check-seo.mjs'));
  await cp(join(TEMPLATE, 'src', 'environments'), join(dir, 'src', 'environments'), { recursive: true });
  await cp(join(TEMPLATE, 'public'), join(dir, 'public'), { recursive: true });
  return dir;
}

function check(dir, env = {}) {
  return spawnSync(process.execPath, [join(dir, 'scripts', 'check-seo.mjs')], {
    encoding: 'utf8',
    env: { ...process.env, ALLOW_PLACEHOLDER_SITE_URL: '', ...env },
  });
}

test('the shipped template is rejected, naming every file and the fix', async () => {
  const dir = await project();

  const result = check(dir);

  strictEqual(result.status, 1);
  for (const file of ['environment.prod.ts', 'robots.txt', 'sitemap.xml', 'llms.txt']) match(result.stderr, new RegExp(file.replace('.', '\\.')));
  match(result.stderr, /npm run configure:seo -- --site-url/);
});

test('passes after configure:seo sets a real domain', async () => {
  const dir = await project();
  await applySiteUrl(dir, 'https://www.mi-sitio.test');

  const result = check(dir);

  strictEqual(result.status, 0, result.stderr);
  deepStrictEqual(await findPlaceholderUrls(dir), []);
});

test('a placeholder left in one crawler file is reported on its own', async () => {
  const dir = await project();
  await applySiteUrl(dir, 'https://www.mi-sitio.test');
  const path = join(dir, 'public', 'llms.txt');
  await writeFile(path, `${await readFile(path, 'utf8')}\n- [Old](https://www.example.org/old)\n`);

  const found = await findPlaceholderUrls(dir);

  deepStrictEqual(found, [{ file: 'public/llms.txt', url: 'https://www.example.org/old' }]);
  strictEqual(check(dir).status, 1);
});

test('ALLOW_PLACEHOLDER_SITE_URL=1 skips the check', async () => {
  const dir = await project();

  strictEqual(check(dir, { ALLOW_PLACEHOLDER_SITE_URL: '1' }).status, 0);
});

test('the dev environment may keep the placeholder; only production matters', async () => {
  const dir = await project();
  await applySiteUrl(dir, 'https://www.mi-sitio.test');
  const dev = join(dir, 'src', 'environments', 'environment.ts');
  await writeFile(dev, (await readFile(dev, 'utf8')).replace(/siteUrl: '[^']*'/, "siteUrl: 'https://www.example.com'"));

  strictEqual(check(dir).status, 0);
});
