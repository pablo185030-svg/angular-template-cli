import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { generateProject } from './generate.js';
import { clackPrompts, createInteractiveReporter, createPlainReporter } from './ui.js';
import { CancelledError, UsageError, resolveOptions } from './wizard.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DEFAULT_TEMPLATES_DIR = join(REPO_ROOT, 'templates');
/** New projects are created next to this repository, not inside it. */
export const DEFAULT_OUT_DIR = dirname(REPO_ROOT);

export const HELP = `Uso: npm run create -- [opciones]

Genera un proyecto Angular nuevo a partir de un template de Coto.

Opciones:
  --type <public|backoffice>  Tipo de app a crear
  --name <nombre-proyecto>    Nombre del proyecto (minúsculas, números y guiones)
  --out <directorio>          Directorio donde crear el proyecto
                              (por defecto: la carpeta que contiene este repositorio)
  --keycloak-url <url>        Backoffice: URL de Keycloak (la parte previa a /realms)
  --keycloak-realm <realm>    Backoffice: realm
  --keycloak-client-id <id>   Backoffice: client id (por defecto: el nombre del proyecto)
  -y, --yes                   Sin preguntas; salida en texto plano (requiere --type y --name)
  -h, --help                  Muestra esta ayuda
`;

/** Relative path to `cd` into, or the absolute one when the relative path climbs too far. */
function cdPathFor(cwd, targetDir) {
  const relativePath = relative(cwd, targetDir) || '.';
  const climbs = relativePath.split(/[\\/]/).filter((part) => part === '..').length;
  const path = climbs > 2 ? targetDir : relativePath;
  return /\s/.test(path) ? `"${path}"` : path;
}

/**
 * Runs the wizard.
 * @param {string[]} argv - Command-line arguments (without node and the script path).
 * @param {object} [deps] - Injectable dependencies, used by tests.
 * @returns {Promise<number>} The process exit code.
 */
export async function run(argv, deps = {}) {
  const {
    prompts = clackPrompts,
    templatesDir = DEFAULT_TEMPLATES_DIR,
    defaultOutDir = DEFAULT_OUT_DIR,
    isTTY = Boolean(process.stdin.isTTY && process.stdout.isTTY),
    cwd = process.cwd(),
    reporterFactory,
    runGit,
    runNode,
    write = (line) => console.log(line),
  } = deps;

  let values;
  try {
    ({ values } = parseArgs({
      args: argv,
      options: {
        type: { type: 'string' },
        name: { type: 'string' },
        out: { type: 'string' },
        'keycloak-url': { type: 'string' },
        'keycloak-realm': { type: 'string' },
        'keycloak-client-id': { type: 'string' },
        yes: { type: 'boolean', short: 'y' },
        help: { type: 'boolean', short: 'h' },
      },
    }));
  } catch (error) {
    write(`Error: ${error.message}\n\n${HELP}`);
    return 1;
  }

  if (values.help) {
    write(HELP);
    return 0;
  }

  const interactive = isTTY && !values.yes;
  const reporter =
    reporterFactory?.(interactive) ??
    (interactive ? createInteractiveReporter() : createPlainReporter(write));

  reporter.intro();

  try {
    const { type, name, keycloak } = await resolveOptions({
      flags: {
        type: values.type,
        name: values.name,
        keycloakUrl: values['keycloak-url'],
        keycloakRealm: values['keycloak-realm'],
        keycloakClientId: values['keycloak-client-id'],
      },
      interactive,
      prompts,
    });
    const targetDir = values.out ? resolve(cwd, values.out, name) : resolve(defaultOutDir, name);

    await generateProject({
      templateDir: join(templatesDir, type),
      targetDir,
      projectName: name,
      runStep: reporter.runStep,
      runGit,
      keycloak,
      runNode,
    });
    reporter.summary({
      name,
      type,
      targetDir,
      cdPath: cdPathFor(cwd, targetDir),
      keycloakConfigured: Boolean(keycloak),
    });
    return 0;
  } catch (error) {
    if (error instanceof CancelledError) {
      reporter.cancelled();
      return 130;
    }
    reporter.error(error.message);
    return error instanceof UsageError ? 2 : 1;
  }
}
