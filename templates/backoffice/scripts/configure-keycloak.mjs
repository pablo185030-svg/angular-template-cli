// Configures Keycloak per environment: writes the settings into an environment file and, for
// `local`, switches development from demo mode to Keycloak. Can also add an environment.
//
//   npm run configure:keycloak                       # asks for each environment
//   npm run configure:keycloak -- --env qa --url https://sso.example.com --realm my-realm --client-id my-app
//   npm run configure:keycloak -- --url https://sso.example.com --realm my-realm  # every environment
//   npm run configure:keycloak -- --add-env qa       # creates environment.qa.ts and its ng configuration
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENVIRONMENTS_DIR = join('src', 'environments');
const RESERVED = ['e2e', 'development', 'production'];

/**
 * Validates the Keycloak settings.
 * @param {{ url?: string, realm?: string, clientId?: string }} settings
 * @returns {string | undefined} An error message, or undefined when the settings are valid.
 */
export function validateKeycloakSettings({ url, realm, clientId }) {
  if (!url || !/^https?:\/\/[^\s']+$/.test(url)) {
    return 'The Keycloak URL must start with http:// or https:// (the part before "/realms").';
  }
  if (!realm || !/^[^\s'/]+$/.test(realm)) return 'Enter the realm name (no spaces or slashes).';
  if (!clientId || !/^[^\s']+$/.test(clientId)) return 'Enter the client id (no spaces).';
  return undefined;
}

/**
 * Validates the name of an extra environment.
 * @param {string | undefined} name
 * @returns {string | undefined} An error message, or undefined when the name is valid.
 */
export function validateEnvironmentName(name) {
  if (!name || !/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) {
    return 'The environment name must be lowercase kebab-case (for example "qa" or "pre-prod").';
  }
  if (name === 'local' || name === 'prod' || RESERVED.includes(name)) {
    return `"${name}" is reserved; choose another environment name.`;
  }
  return undefined;
}

/**
 * Environment file name for an environment: `local` is `environment.ts`.
 * @param {string} env
 */
export function environmentFile(env) {
  return env === 'local' ? 'environment.ts' : `environment.${env}.ts`;
}

/**
 * Lists the environments of a project (`local` first), without `e2e`.
 * @param {string} projectDir
 * @returns {Promise<string[]>}
 */
export async function listEnvironments(projectDir) {
  const files = await readdir(join(projectDir, ENVIRONMENTS_DIR));
  const names = files
    .map((file) => file.match(/^environment(?:\.([a-z0-9-]+))?\.ts$/))
    .filter(Boolean)
    .map((match) => match[1] ?? 'local')
    .filter((name) => name !== 'e2e');
  return ['local', ...names.filter((name) => name !== 'local').sort()];
}

function setAuthConfig(source, { url, realm, clientId }) {
  const pattern = /(authConfig:\s*\{)([^}]*?)(\n\s*\},)/;
  if (!pattern.test(source)) throw new Error('Could not find the "authConfig" block.');
  return source.replace(pattern, (_match, open, body, close) => {
    const updated = body
      .replace(/issuer:\s*'[^']*'/, `issuer: '${url}/realms/${realm}'`)
      .replace(/clientId:\s*'[^']*'/, `clientId: '${clientId}'`)
      .replace(/requireHttps:\s*(true|false)/, `requireHttps: ${url.startsWith('https://')}`);
    return `${open}${updated}${close}`;
  });
}

/**
 * Applies Keycloak settings to one environment file. For `local` it also sets the mode to
 * 'keycloak'. The `e2e` environment is never configured: it always uses the demo mode.
 * @param {string} projectDir - Project root (where `src/` lives).
 * @param {string} env - Environment name (`local`, `prod` or an extra one).
 * @param {{ url: string, realm: string, clientId: string }} settings
 */
export async function applyKeycloakSettings(projectDir, env, settings) {
  const error = validateKeycloakSettings(settings);
  if (error) throw new Error(error);
  if (!(await listEnvironments(projectDir)).includes(env)) {
    throw new Error(`Unknown environment "${env}".`);
  }

  const path = join(projectDir, ENVIRONMENTS_DIR, environmentFile(env));
  let source = setAuthConfig(await readFile(path, 'utf8'), settings);
  if (env === 'local') {
    if (!/mode:\s*'(mock|keycloak)'/.test(source)) throw new Error('Could not find auth.mode.');
    source = source.replace(/mode:\s*'(mock|keycloak)'/, "mode: 'keycloak'");
  }
  await writeFile(path, source);
}

/**
 * Creates an extra environment: `environment.<name>.ts` (a copy of the production one, always
 * authenticating against Keycloak), its Angular build and serve configurations and npm scripts.
 * @param {string} projectDir - Project root.
 * @param {string} name - New environment name.
 */
export async function addEnvironment(projectDir, name) {
  const error = validateEnvironmentName(name);
  if (error) throw new Error(error);
  if ((await listEnvironments(projectDir)).includes(name)) {
    throw new Error(`The environment "${name}" already exists.`);
  }

  const angularPath = join(projectDir, 'angular.json');
  const angular = JSON.parse(await readFile(angularPath, 'utf8'));
  const [projectName, project] = Object.entries(angular.projects)[0];
  const { build, serve } = project.architect;
  const production = build.configurations.production;
  const fileReplacements = production.fileReplacements.map((entry) => ({
    ...entry,
    with: `src/environments/${environmentFile(name)}`,
  }));
  build.configurations[name] = { ...production, fileReplacements };
  serve.configurations[name] = { buildTarget: `${projectName}:build:${name}` };

  const packagePath = join(projectDir, 'package.json');
  const pkg = JSON.parse(await readFile(packagePath, 'utf8'));
  pkg.scripts[`build:${name}`] = `ng build --configuration ${name}`;
  pkg.scripts[`start:${name}`] = `ng serve --configuration ${name}`;

  const prod = await readFile(join(projectDir, ENVIRONMENTS_DIR, environmentFile('prod')), 'utf8');
  await writeFile(
    join(projectDir, ENVIRONMENTS_DIR, environmentFile(name)),
    prod.replace(/envName:\s*'[^']*'/, `envName: '${name}'`),
  );
  await writeFile(angularPath, `${JSON.stringify(angular, null, 2)}\n`);
  await writeFile(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
}

async function readCurrent(projectDir, env) {
  const source = await readFile(join(projectDir, ENVIRONMENTS_DIR, environmentFile(env)), 'utf8');
  const issuer = source.match(/issuer:\s*'([^']*)'/)?.[1] ?? '';
  const [url, realm] = issuer.split('/realms/');
  return { url, realm, clientId: source.match(/clientId:\s*'([^']*)'/)?.[1] };
}

async function main() {
  const { values } = parseArgs({
    options: {
      env: { type: 'string' },
      'add-env': { type: 'string', multiple: true },
      url: { type: 'string' },
      realm: { type: 'string' },
      'client-id': { type: 'string' },
    },
  });

  for (const name of values['add-env'] ?? []) {
    await addEnvironment(ROOT, name);
    console.log(`Environment "${name}" created (src/environments/${environmentFile(name)}).`);
  }
  const given = { url: values.url, realm: values.realm, clientId: values['client-id'] };
  const complete = given.url && given.realm && given.clientId;
  const flagsGiven = Boolean(given.url || given.realm || given.clientId);
  if (values['add-env'] && !values.env && !flagsGiven) return;

  const environments = values.env ? [values.env] : await listEnvironments(ROOT);
  const rl = complete ? undefined : createInterface({ input: process.stdin, output: process.stdout });
  let previous = {};
  for (const env of environments) {
    const settings = { ...given };
    if (!complete) {
      const current = await readCurrent(ROOT, env);
      const ask = async (label, fallback) =>
        (await rl.question(`[${env}] ${label} [${fallback}]: `)).trim() || fallback;
      settings.url ??= await ask('Keycloak URL (before /realms)', previous.url ?? current.url);
      settings.realm ??= await ask('Realm', previous.realm ?? current.realm);
      settings.clientId ??= await ask('Client id', previous.clientId ?? current.clientId);
      previous = settings;
    }
    await applyKeycloakSettings(ROOT, env, settings);
    console.log(`Keycloak configured for ${env}: ${settings.url}/realms/${settings.realm} (${settings.clientId})`);
  }
  rl?.close();
  console.log(
    'Add the app URL of each environment (http://localhost:4200/* for local) as a valid redirect URI of its client.',
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });
}
