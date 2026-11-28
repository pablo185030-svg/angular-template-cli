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
  --type <website|backoffice>  Tipo de app a crear
  --name <nombre-proyecto>    Nombre del proyecto (minúsculas, números y guiones)
  --out <directorio>          Directorio donde crear el proyecto
                              (por defecto: la carpeta que contiene este repositorio)
  --environments <lista>      Backoffice: ambientes adicionales separados por coma (ej.: dev,qa);
                              local y prod siempre existen
  --keycloak <amb>=<url>,<realm>[,<client-id>]
                              Backoffice: Keycloak de un ambiente (se repite por ambiente);
                              el client id es por defecto el nombre del proyecto
  --keycloak-url <url>        Backoffice: URL de Keycloak para todos los ambientes (la parte previa a /realms)
  --keycloak-realm <realm>    Backoffice: realm para todos los ambientes
  --keycloak-client-id <id>   Backoffice: client id para todos los ambientes
  --no-mock-api               Backoffice: sin la API mock; el ABM usa un JSON con datos de ejemplo
                              y guarda los cambios solo en la memoria del navegador
  --dark-mode                 Soportar modo oscuro (botón en el header; por defecto solo tema claro)
  --rendering <ssr|ssg|spa>   Sitio web: modo de renderizado (por defecto ssr; spa tiene SEO limitado)
  --site-url <url>            Sitio web: dominio de producción (ej.: https://www.mi-sitio.com); si no se
                              indica, queda un dominio de ejemplo y el build de producción falla hasta configurarlo
  --remote <url>              Conectar un repositorio git existente como "origin" (no se sube nada)
  --no-commit                 No crear el commit inicial (con -y o sin terminal tampoco se crea)
  --install                   Instalar las dependencias al terminar (npm install)
  --no-install                No instalar las dependencias (es el valor por defecto)
  --angular-skill             Instalar el skill oficial de Angular (angular-developer)
                              con npx skills add; necesita red y no es obligatorio
  --no-angular-skill          No instalar el skill de Angular (es el valor por defecto)
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
    runNpm,
    runSkills,
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
        environments: { type: 'string' },
        keycloak: { type: 'string', multiple: true },
        'keycloak-url': { type: 'string' },
        'keycloak-realm': { type: 'string' },
        'keycloak-client-id': { type: 'string' },
        'no-mock-api': { type: 'boolean' },
        'dark-mode': { type: 'boolean' },
        rendering: { type: 'string' },
        'site-url': { type: 'string' },
        remote: { type: 'string' },
        'no-commit': { type: 'boolean' },
        install: { type: 'boolean' },
        'no-install': { type: 'boolean' },
        'angular-skill': { type: 'boolean' },
        'no-angular-skill': { type: 'boolean' },
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

  if (values.install && values['no-install']) {
    write(`Error: --install y --no-install no se pueden usar juntas.\n\n${HELP}`);
    return 1;
  }

  if (values['angular-skill'] && values['no-angular-skill']) {
    write(`Error: --angular-skill y --no-angular-skill no se pueden usar juntas.\n\n${HELP}`);
    return 1;
  }

  const interactive = isTTY && !values.yes;
  const reporter =
    reporterFactory?.(interactive) ??
    (interactive ? createInteractiveReporter() : createPlainReporter(write));

  await reporter.intro();

  try {
    const { type, name, keycloak, environments, mockApi, darkMode, rendering, siteUrl, outDir, remote, commit, install, angularSkill } = await resolveOptions({
      flags: {
        type: values.type,
        name: values.name,
        environments: values.environments,
        keycloak: values.keycloak,
        keycloakUrl: values['keycloak-url'],
        keycloakRealm: values['keycloak-realm'],
        keycloakClientId: values['keycloak-client-id'],
        mockApi: values['no-mock-api'] ? false : undefined,
        darkMode: values['dark-mode'] ? true : undefined,
        rendering: values.rendering,
        siteUrl: values['site-url'],
        outDir: values.out,
        remote: values.remote,
        commit: values['no-commit'] ? false : undefined,
        install: values.install ? true : values['no-install'] ? false : undefined,
        angularSkill: values['angular-skill'] ? true : values['no-angular-skill'] ? false : undefined,
      },
      interactive,
      prompts,
      defaultOutDir,
      redraw: reporter.redraw,
    });
    const targetDir = resolve(cwd, outDir ?? defaultOutDir, name);

    const { committed, installed, skillInstalled } = await generateProject({
      templateDir: join(templatesDir, type),
      targetDir,
      projectName: name,
      runStep: reporter.runStep,
      runGit,
      keycloak,
      environments,
      mockApi,
      darkMode,
      rendering,
      siteUrl,
      remote,
      commit,
      install,
      angularSkill,
      runNode,
      runNpm,
      runSkills,
    });
    reporter.summary({
      name,
      type,
      targetDir,
      cdPath: cdPathFor(cwd, targetDir),
      environments: type === 'backoffice' ? ['local', ...environments, 'prod'] : undefined,
      keycloakEnvironments: keycloak ? Object.keys(keycloak) : [],
      mockApi,
      darkMode,
      rendering,
      siteUrl,
      remote,
      committed,
      installed,
      angularSkill,
      skillInstalled,
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
