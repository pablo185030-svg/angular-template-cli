import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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
  return templatesDir;
}

/** Prompts double: returns queued answers in order; `CANCEL` simulates Ctrl+C. */
export const CANCEL = Symbol('cancel');

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
    isCancel: (value) => value === CANCEL,
  };
}
