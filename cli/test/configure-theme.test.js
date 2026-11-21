import { match, rejects, strictEqual } from 'node:assert';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { makeTempDir } from '../support/test-helpers.js';
import { applyThemeSettings } from '../../templates/backoffice/scripts/configure-theme.mjs';

const TEMPLATES = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'templates');

async function project(type) {
  const dir = await makeTempDir();
  await mkdir(join(dir, 'src'), { recursive: true });
  await cp(join(TEMPLATES, type, 'src', 'environments'), join(dir, 'src', 'environments'), { recursive: true });
  return dir;
}

const read = (dir, file) => readFile(join(dir, 'src', 'environments', file), 'utf8');

for (const type of ['public', 'backoffice']) {
  test(`${type}: ships light only`, async () => {
    match(await readFile(join(TEMPLATES, type, 'src', 'environments', 'environment.ts'), 'utf8'), /darkMode: false/);
  });

  test(`${type}: enables and disables dark mode in every environment file`, async () => {
    const dir = await project(type);
    const files = type === 'backoffice'
      ? ['environment.ts', 'environment.prod.ts', 'environment.e2e.ts']
      : ['environment.ts', 'environment.prod.ts'];

    await applyThemeSettings(dir, true);
    for (const file of files) match(await read(dir, file), /darkMode: true/);

    await applyThemeSettings(dir, false);
    for (const file of files) match(await read(dir, file), /darkMode: false/);
  });
}

test('the theme script is identical in both templates', async () => {
  const [a, b] = await Promise.all(
    ['public', 'backoffice'].map((type) => readFile(join(TEMPLATES, type, 'scripts', 'configure-theme.mjs'), 'utf8')),
  );

  strictEqual(a, b);
});

test('fails loudly when the setting is missing', async () => {
  const dir = await makeTempDir();
  await mkdir(join(dir, 'src', 'environments'), { recursive: true });
  await writeFile(join(dir, 'src', 'environments', 'environment.ts'), 'export const environment = {};');

  await rejects(applyThemeSettings(dir, true), /Could not find theme\.darkMode/);
});
