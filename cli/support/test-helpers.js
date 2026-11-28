import { cp, mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REAL_TEMPLATES = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'templates');
const REAL_BACKOFFICE = join(REAL_TEMPLATES, 'backoffice');

/** Creates a temp directory and returns its path. */
export function makeTempDir() {
  return mkdtemp(join(tmpdir(), 'coto-wizard-'));
}

/**
 * Creates a fixture `templates/` directory with a public and a backoffice template, each with
 * text files that contain the placeholder, a binary file, and directories that must not be copied.
 * @param {string} root - Temp directory to create it in.
 * @returns {Promise<string>} The templates directory path.
 */
export async function makeTemplates(root) {
  const templatesDir = join(root, 'templates');
  for (const type of ['public', 'backoffice']) {
    const dir = join(templatesDir, type);
    await mkdir(join(dir, 'src'), { recursive: true });
    await mkdir(join(dir, 'node_modules', 'dep'), { recursive: true });
    await mkdir(join(dir, 'dist'), { recursive: true });
    await writeFile(join(dir, 'package.json'), '{ "name": "coto-angular-template" }\n');
    await writeFile(join(dir, 'src', 'index.html'), '<title>coto-angular-template</title>\n');
    await writeFile(join(dir, 'node_modules', 'dep', 'index.js'), 'coto-angular-template');
    await writeFile(join(dir, 'dist', 'main.js'), 'coto-angular-template');
    // Binary file: has a NUL byte and contains the placeholder bytes. Must stay untouched.
    await writeFile(
      join(dir, 'logo.bin'),
      Buffer.concat([Buffer.from([0, 1, 2]), Buffer.from('coto-angular-template')]),
    );
  }
  await addProjectScripts(join(templatesDir, 'backoffice'), 'backoffice');
  await addProjectScripts(join(templatesDir, 'public'), 'public');
  return templatesDir;
}

/**
 * Copies the real project scripts (Keycloak, theme, remove-mock-api) and the files they edit
 * into a fixture template, so the wizard's post-copy steps run for real.
 */
async function addProjectScripts(dir, type) {
  const real = join(REAL_TEMPLATES, type);
  await mkdir(join(dir, 'scripts'), { recursive: true });
  await mkdir(join(dir, 'src', 'environments'), { recursive: true });
  await cp(join(real, 'src', 'environments'), join(dir, 'src', 'environments'), { recursive: true });
  await cp(join(real, 'scripts', 'configure-theme.mjs'), join(dir, 'scripts', 'configure-theme.mjs'));
  if (type === 'public') {
    await cp(join(real, 'scripts', 'configure-seo.mjs'), join(dir, 'scripts', 'configure-seo.mjs'));
    await cp(join(real, 'public'), join(dir, 'public'), { recursive: true });
  }
  if (type !== 'backoffice') return;
  for (const script of ['configure-keycloak.mjs', 'remove-mock-api.mjs']) {
    await cp(join(real, 'scripts', script), join(dir, 'scripts', script));
  }
  for (const file of ['playwright.config.ts', 'angular.json', 'package.json', 'proxy.conf.json']) {
    await cp(join(real, file), join(dir, file));
  }
  await cp(join(real, 'mock'), join(dir, 'mock'), { recursive: true });
}

/** Prompts double: returns queued answers in order; `CANCEL` simulates Ctrl+C. */
export const CANCEL = Symbol('cancel');
/** Simulates Esc (go back). */
export const BACK = Symbol('back');

export function fakePrompts(answers) {
  const queue = [...answers];
  const asked = [];
  return {
    asked,
    select: async (options) => {
      asked.push(options);
      return queue.shift();
    },
    text: async (options) => {
      asked.push(options);
      return queue.shift();
    },
    confirm: async (options) => {
      asked.push(options);
      return queue.shift();
    },
    isCancel: (value) => value === CANCEL,
    isBack: (value) => value === BACK,
  };
}

const RENDERING_FILES = [
  'angular.json',
  'package.json',
  'Dockerfile',
  'nginx.conf',
  'src/main.server.ts',
  'src/server.ts',
  'src/app/app.config.ts',
  'src/app/app.config.server.ts',
  'src/app/app.routes.server.ts',
  'scripts/configure-rendering.mjs',
];

/**
 * Copies the real files the rendering script converts (and the script itself) from the public
 * template into `directory`, overwriting what is there.
 */
export async function addRenderingFiles(directory) {
  for (const file of RENDERING_FILES) {
    await mkdir(dirname(join(directory, file)), { recursive: true });
    await cp(join(REAL_TEMPLATES, 'public', file), join(directory, file));
  }
}
