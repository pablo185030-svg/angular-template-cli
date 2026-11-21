import { execFileSync } from 'node:child_process';
import { cp, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { EXCLUDED_NAMES, TEMPLATE_NAME } from './constants.js';

/**
 * Throws when the target directory exists and is not empty.
 * @param {string} targetDir - Directory the project will be created in.
 */
export async function assertTargetAvailable(targetDir) {
  let entries;
  try {
    entries = await readdir(targetDir);
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  if (entries.length > 0) {
    throw new Error(`El directorio "${targetDir}" ya existe y no está vacío.`);
  }
}

/**
 * Copies a template into the target directory, skipping build output and dependencies.
 * @param {string} templateDir - Source template directory.
 * @param {string} targetDir - Destination directory.
 */
export async function copyTemplate(templateDir, targetDir) {
  await mkdir(targetDir, { recursive: true });
  await cp(templateDir, targetDir, {
    recursive: true,
    filter: (source) => !EXCLUDED_NAMES.has(source.split(/[\\/]/).pop() ?? ''),
  });
}

async function* walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      yield* walk(path);
    } else if (entry.isFile()) {
      yield path;
    }
  }
}

/** A file is binary when its first bytes contain a NUL character. */
function isBinary(buffer) {
  return buffer.subarray(0, 8000).includes(0);
}

/**
 * Replaces the template name with the project name in every text file under `directory`.
 * Binary files are skipped.
 * @param {string} directory - Generated project directory.
 * @param {string} projectName - The user's project name.
 * @returns {Promise<number>} How many files were modified.
 */
export async function replacePlaceholders(directory, projectName) {
  let changed = 0;
  for await (const file of walk(directory)) {
    const buffer = await readFile(file);
    if (isBinary(buffer)) continue;
    const text = buffer.toString('utf8');
    if (!text.includes(TEMPLATE_NAME)) continue;
    await writeFile(file, text.replaceAll(TEMPLATE_NAME, projectName));
    changed++;
  }
  return changed;
}

/**
 * Throws when any text file still contains the template name.
 * @param {string} directory - Generated project directory.
 * @param {string} projectName - The user's project name (a name containing the template name is exempt).
 */
export async function assertNoPlaceholders(directory, projectName) {
  if (projectName.includes(TEMPLATE_NAME)) return;
  const leftovers = [];
  for await (const file of walk(directory)) {
    const buffer = await readFile(file);
    if (!isBinary(buffer) && buffer.toString('utf8').includes(TEMPLATE_NAME)) {
      leftovers.push(file);
    }
  }
  if (leftovers.length > 0) {
    throw new Error(`No se reemplazó por completo el nombre del template en: ${leftovers.join(', ')}`);
  }
}

/**
 * Initializes a fresh git repository on `main`.
 * @param {string} directory - Generated project directory.
 * @param {(args: string[], cwd: string) => void} [runGit] - Git runner, injectable for tests.
 */
export function initGit(directory, runGit = defaultRunGit) {
  runGit(['init', '-b', 'main'], directory);
}

function defaultRunGit(args, cwd) {
  execFileSync('git', args, { cwd, stdio: 'ignore' });
}

/**
 * Registers the remote repository as `origin`. Nothing is pushed.
 * @param {string} directory - Generated project directory.
 * @param {string} url - Remote repository URL.
 * @param {(args: string[], cwd: string) => void} [runGit] - Git runner, injectable for tests.
 */
export function addRemote(directory, url, runGit = defaultRunGit) {
  runGit(['remote', 'add', 'origin', url], directory);
}

/**
 * Commits every generated file.
 * @param {string} directory - Generated project directory.
 * @param {(args: string[], cwd: string) => void} [runGit] - Git runner, injectable for tests.
 */
export function createInitialCommit(directory, runGit = defaultRunGit) {
  runGit(['add', '-A'], directory);
  runGit(['commit', '-m', 'chore: initial commit'], directory);
}

/**
 * Installs the project's dependencies. Husky is disabled so it does not touch git config.
 * @param {string} directory - Generated project directory.
 * @param {(args: string[], cwd: string) => void} [runNpm] - npm runner, injectable for tests.
 */
export function installDependencies(directory, runNpm = defaultRunNpm) {
  runNpm(['install'], directory);
}

function defaultRunNpm(args, cwd) {
  const windows = process.platform === 'win32';
  execFileSync(windows ? 'npm.cmd' : 'npm', args, {
    cwd,
    stdio: 'pipe',
    shell: windows,
    env: { ...process.env, HUSKY: '0' },
  });
}

/** Last meaningful line of a failed command's output, for the warning shown to the user. */
function failureDetail(error) {
  const text = `${error.stderr ?? ''}`.trim() || error.message;
  return text.split('\n').filter(Boolean).slice(-3).join(' | ');
}

/**
 * Writes the Keycloak settings into a generated backoffice by running the project's own
 * `scripts/configure-keycloak.mjs`, the same script behind `npm run configure:keycloak`.
 * @param {string} directory - Generated project directory.
 * @param {{ url: string, realm: string, clientId: string }} settings
 * @param {(args: string[], cwd: string) => void} [runNode] - Node runner, injectable for tests.
 */
export function configureKeycloak(directory, { url, realm, clientId }, runNode = defaultRunNode) {
  runNode(
    ['scripts/configure-keycloak.mjs', '--url', url, '--realm', realm, '--client-id', clientId],
    directory,
  );
}

function defaultRunNode(args, cwd) {
  execFileSync(process.execPath, args, { cwd, stdio: 'pipe' });
}

/**
 * Removes the mock API from a generated backoffice by running the project's own
 * `scripts/remove-mock-api.mjs`, the same script behind `npm run remove:mock-api`.
 * @param {string} directory - Generated project directory.
 * @param {(args: string[], cwd: string) => void} [runNode] - Node runner, injectable for tests.
 */
export function removeMockApi(directory, runNode = defaultRunNode) {
  runNode(['scripts/remove-mock-api.mjs'], directory);
}

/**
 * Enables dark mode support by running the project's own `scripts/configure-theme.mjs`, the same
 * script behind `npm run configure:theme`.
 * @param {string} directory - Generated project directory.
 * @param {(args: string[], cwd: string) => void} [runNode] - Node runner, injectable for tests.
 */
export function enableDarkMode(directory, runNode = defaultRunNode) {
  runNode(['scripts/configure-theme.mjs', '--dark-mode'], directory);
}

/**
 * Converts the public website from SSR to SSG or SPA by running the project's own
 * `scripts/configure-rendering.mjs`, the same script behind `npm run configure:rendering`.
 * @param {string} directory - Generated project directory.
 * @param {'ssg' | 'spa'} mode
 * @param {(args: string[], cwd: string) => void} [runNode] - Node runner, injectable for tests.
 */
export function configureRendering(directory, mode, runNode = defaultRunNode) {
  runNode(['scripts/configure-rendering.mjs', '--mode', mode], directory);
}

/**
 * Generates a project: checks the target, copies the template, renames it, verifies the
 * rename and initializes git. Each step is reported through `runStep`.
 * @param {object} options
 * @param {string} options.templateDir - Template directory to copy.
 * @param {string} options.targetDir - Where to create the project.
 * @param {string} options.projectName - The user's project name.
 * @param {(label: string, action: () => Promise<void> | void) => Promise<void>} options.runStep
 *   Runs one step, showing progress. Must rethrow when the action fails. An action may return a
 *   string: a warning for a step that did not fail the generation.
 * @param {(args: string[], cwd: string) => void} [options.runGit] - Git runner, injectable for tests.
 * @param {{ url: string, realm: string, clientId: string }} [options.keycloak] - Keycloak settings
 *   to write into a backoffice; omitted to leave the project in demo mode.
 * @param {boolean} [options.mockApi] - Backoffice only: false removes the mock API (default true).
 * @param {boolean} [options.darkMode] - True enables dark mode support (default false: light only).
 * @param {'ssr' | 'ssg' | 'spa'} [options.rendering] - Public website only; ssg and spa convert the
 *   template (default ssr: left as it is).
 * @param {(args: string[], cwd: string) => void} [options.runNode] - Node runner, injectable for tests.
 * @param {string} [options.remote] - Git remote URL registered as `origin` (never pushed).
 * @param {boolean} [options.commit] - Creates an initial commit (default false).
 * @param {boolean} [options.install] - Runs `npm install` (default false).
 * @param {(args: string[], cwd: string) => void} [options.runNpm] - npm runner, injectable for tests.
 * @returns {Promise<{ committed: boolean, installed: boolean }>} What was actually done. Commit and
 *   install failures are not fatal: their step reports a warning and the project is kept.
 */
export async function generateProject({
  templateDir,
  targetDir,
  projectName,
  runStep,
  runGit,
  keycloak,
  mockApi = true,
  darkMode = false,
  rendering = 'ssr',
  runNode,
  remote,
  commit = false,
  install = false,
  runNpm,
}) {
  const templateExists = await stat(templateDir).then(
    (info) => info.isDirectory(),
    () => false,
  );
  if (!templateExists) {
    throw new Error(`No se encontró el template: ${templateDir}`);
  }

  await runStep('Verificando el directorio de destino', () => assertTargetAvailable(targetDir));
  await runStep('Copiando el template', () => copyTemplate(templateDir, targetDir));
  await runStep(`Nombrando el proyecto "${projectName}"`, async () => {
    await replacePlaceholders(targetDir, projectName);
    await assertNoPlaceholders(targetDir, projectName);
  });
  if (keycloak) {
    await runStep('Configurando Keycloak', () => configureKeycloak(targetDir, keycloak, runNode));
  }
  if (!mockApi) {
    await runStep('Quitando la API mock', () => removeMockApi(targetDir, runNode));
  }
  if (darkMode) {
    await runStep('Habilitando el modo oscuro', () => enableDarkMode(targetDir, runNode));
  }
  if (rendering !== 'ssr') {
    await runStep(`Configurando el renderizado (${rendering.toUpperCase()})`, () =>
      configureRendering(targetDir, rendering, runNode),
    );
  }
  await runStep('Inicializando el repositorio git', () => initGit(targetDir, runGit));
  if (remote) {
    await runStep('Conectando el repositorio remoto (origin)', () => addRemote(targetDir, remote, runGit));
  }

  let installed = false;
  if (install) {
    await runStep('Instalando dependencias (puede tardar)', () => {
      try {
        installDependencies(targetDir, runNpm);
        installed = true;
      } catch (error) {
        return `No se pudieron instalar las dependencias; corré npm install más tarde. ${failureDetail(error)}`;
      }
    });
  }

  let committed = false;
  if (commit) {
    await runStep('Creando el commit inicial', () => {
      try {
        createInitialCommit(targetDir, runGit);
        committed = true;
      } catch (error) {
        return `No se pudo crear el commit inicial (¿git tiene user.name y user.email configurados?). ${failureDetail(error)}`;
      }
    });
  }
  return { committed, installed };
}
