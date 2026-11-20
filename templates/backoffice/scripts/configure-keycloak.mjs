// Writes the Keycloak settings into the environment files and switches local development from
// demo mode to Keycloak.
//
//   npm run configure:keycloak                       # asks for each value
//   npm run configure:keycloak -- --url https://sso.example.com --realm my-realm --client-id my-app
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEV_FILE = join('src', 'environments', 'environment.ts');
const PROD_FILE = join('src', 'environments', 'environment.prod.ts');

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

function setKeycloakBlock(source, { url, realm, clientId }) {
  const pattern = /(keycloak:\s*\{)([^}]*)(\})/;
  if (!pattern.test(source)) throw new Error('Could not find the "keycloak" block.');
  return source.replace(pattern, (_match, open, body, close) => {
    const updated = body
      .replace(/url:\s*'[^']*'/, `url: '${url}'`)
      .replace(/realm:\s*'[^']*'/, `realm: '${realm}'`)
      .replace(/clientId:\s*'[^']*'/, `clientId: '${clientId}'`);
    return `${open}${updated}${close}`;
  });
}

/**
 * Applies the settings to the dev and prod environment files and sets the dev mode to 'keycloak'.
 * @param {string} projectDir - Project root (where `src/` lives).
 * @param {{ url: string, realm: string, clientId: string }} settings
 */
export async function applyKeycloakSettings(projectDir, settings) {
  const error = validateKeycloakSettings(settings);
  if (error) throw new Error(error);

  const devPath = join(projectDir, DEV_FILE);
  const dev = setKeycloakBlock(await readFile(devPath, 'utf8'), settings);
  if (!/mode:\s*'(mock|keycloak)'/.test(dev)) throw new Error('Could not find auth.mode.');
  await writeFile(devPath, dev.replace(/mode:\s*'(mock|keycloak)'/, "mode: 'keycloak'"));

  const prodPath = join(projectDir, PROD_FILE);
  await writeFile(prodPath, setKeycloakBlock(await readFile(prodPath, 'utf8'), settings));
}

async function readCurrent(projectDir) {
  const source = await readFile(join(projectDir, PROD_FILE), 'utf8');
  const pick = (key) => source.match(new RegExp(`${key}:\\s*'([^']*)'`))?.[1];
  return { url: pick('url'), realm: pick('realm'), clientId: pick('clientId') };
}

async function main() {
  const { values } = parseArgs({
    options: {
      url: { type: 'string' },
      realm: { type: 'string' },
      'client-id': { type: 'string' },
    },
  });
  const current = await readCurrent(ROOT);
  const settings = { url: values.url, realm: values.realm, clientId: values['client-id'] };

  if (!settings.url || !settings.realm || !settings.clientId) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const ask = async (label, fallback) =>
      (await rl.question(`${label} [${fallback}]: `)).trim() || fallback;
    settings.url ??= await ask('Keycloak URL (before /realms)', current.url);
    settings.realm ??= await ask('Realm', current.realm);
    settings.clientId ??= await ask('Client id', current.clientId);
    rl.close();
  }

  await applyKeycloakSettings(ROOT, settings);
  console.log('Keycloak configured. Local development now authenticates against it:');
  console.log(
    `  url: ${settings.url}\n  realm: ${settings.realm}\n  clientId: ${settings.clientId}`,
  );
  console.log(
    'Add http://localhost:4200/* as a valid redirect URI of the client, then run npm start.',
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });
}
