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
 * Generates a project: checks the target, copies the template, renames it, verifies the
 * rename and initializes git. Each step is reported through `runStep`.
 * @param {object} options
 * @param {string} options.templateDir - Template directory to copy.
 * @param {string} options.targetDir - Where to create the project.
 * @param {string} options.projectName - The user's project name.
 * @param {(label: string, action: () => Promise<void> | void) => Promise<void>} options.runStep
 *   Runs one step, showing progress. Must rethrow when the action fails.
 * @param {(args: string[], cwd: string) => void} [options.runGit] - Git runner, injectable for tests.
 */
export async function generateProject({ templateDir, targetDir, projectName, runStep, runGit }) {
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
  await runStep('Inicializando el repositorio git', () => initGit(targetDir, runGit));
}
