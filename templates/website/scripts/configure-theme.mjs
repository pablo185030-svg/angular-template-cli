// Turns dark mode support on or off. When on, the header shows a light/dark toggle and the app
// starts in light mode; when off, the app is always light and shows no toggle.
//
//   npm run configure:theme -- --dark-mode      # support light and dark
//   npm run configure:theme -- --no-dark-mode   # light only
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Sets `theme.darkMode` in every environment file of the project.
 * @param {string} projectDir - Project root (where `src/` lives).
 * @param {boolean} darkMode - Whether dark mode is supported.
 */
export async function applyThemeSettings(projectDir, darkMode) {
  const directory = join(projectDir, 'src', 'environments');
  const files = (await readdir(directory)).filter((file) => /^environment.*\.ts$/.test(file));
  if (files.length === 0) throw new Error('Could not find the environment files.');

  for (const file of files) {
    const path = join(directory, file);
    const source = await readFile(path, 'utf8');
    if (!/darkMode:\s*(true|false)/.test(source)) {
      throw new Error(`Could not find theme.darkMode in ${file}.`);
    }
    await writeFile(path, source.replace(/darkMode:\s*(true|false)/, `darkMode: ${darkMode}`));
  }
}

async function main() {
  const { values } = parseArgs({
    options: { 'dark-mode': { type: 'boolean' }, 'no-dark-mode': { type: 'boolean' } },
  });
  if (values['dark-mode'] === undefined && values['no-dark-mode'] === undefined) {
    throw new Error('Pass --dark-mode or --no-dark-mode.');
  }
  if (values['dark-mode'] && values['no-dark-mode']) {
    throw new Error('Pass only one of --dark-mode and --no-dark-mode.');
  }
  const darkMode = Boolean(values['dark-mode']);
  await applyThemeSettings(ROOT, darkMode);
  console.log(
    darkMode
      ? 'Dark mode enabled: the header shows a theme toggle (the app starts in light mode).'
      : 'Dark mode disabled: the app is light only.',
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });
}
