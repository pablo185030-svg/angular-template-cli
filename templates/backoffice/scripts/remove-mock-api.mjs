// Removes the mock API from the project and switches the products example to its JSON data
// source: the sample products load from `public/mock/products.json` and changes stay in browser
// memory. Run it once, before connecting a real backend or when you do not want the mock server.
//
//   npm run remove:mock-api
import { readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENVIRONMENTS = ['environment.ts', 'environment.e2e.ts'];

async function edit(path, transform) {
  await writeFile(path, transform(await readFile(path, 'utf8')));
}

function replaceOnce(source, pattern, replacement, what) {
  if (!pattern.test(source)) throw new Error(`Could not find ${what}.`);
  return source.replace(pattern, replacement);
}

/**
 * Switches the dev and e2e environments to the JSON data source, deletes the mock API server and
 * removes its npm scripts, the dev proxy and the Playwright web server entry.
 * @param {string} projectDir - Project root.
 */
export async function removeMockApi(projectDir) {
  for (const file of ENVIRONMENTS) {
    await edit(join(projectDir, 'src', 'environments', file), (source) =>
      replaceOnce(source, /mode: 'http'/, "mode: 'json'", `api.mode in ${file}`),
    );
  }

  await edit(join(projectDir, 'playwright.config.ts'), (source) =>
    replaceOnce(
      source,
      /\s*\{\s*command: 'npm run mock:api',[^}]*\},/,
      '',
      'the mock API web server in playwright.config.ts',
    ),
  );

  await edit(join(projectDir, 'angular.json'), (source) =>
    replaceOnce(
      source,
      /,\s*"proxyConfig": "proxy\.conf\.json"/,
      '',
      'proxyConfig in angular.json',
    ),
  );

  await edit(join(projectDir, 'package.json'), (source) => {
    const pkg = JSON.parse(source);
    delete pkg.scripts['mock:api'];
    delete pkg.scripts['remove:mock-api'];
    return `${JSON.stringify(pkg, null, 2)}\n`;
  });

  await rm(join(projectDir, 'mock'), { recursive: true, force: true });
  await rm(join(projectDir, 'proxy.conf.json'), { force: true });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  removeMockApi(ROOT)
    .then(() => {
      console.log('Mock API removed. The products example now loads public/mock/products.json');
      console.log('and keeps changes in browser memory. To use a real backend, set');
      console.log("api.mode to 'http' in the environment files and point /api at it.");
    })
    .catch((error) => {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    });
}
