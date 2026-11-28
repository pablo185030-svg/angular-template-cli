// Stops a production build that would publish the placeholder domain (example.com) in canonical
// links, social tags, the sitemap or structured data. Runs as the npm `prebuild` script.
//
//   npm run configure:seo -- --site-url https://www.your-domain.com   # fixes it
//   ALLOW_PLACEHOLDER_SITE_URL=1 npm run build                        # skips the check
import { realpathSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILES = ['public/robots.txt', 'public/sitemap.xml', 'public/llms.txt'];
const ENVIRONMENT = 'src/environments/environment.prod.ts';
const PLACEHOLDER_URL = /https?:\/\/(?:[\w-]+\.)*example\.(?:com|org|net)\b[^\s"'<>)]*/g;

/**
 * Finds placeholder URLs in the production environment and the crawler files.
 * @param {string} projectDir - Project root (where `src/` and `public/` live).
 * @returns {Promise<{ file: string, url: string }[]>} One entry per file with the first URL found.
 */
export async function findPlaceholderUrls(projectDir) {
  const found = [];
  for (const file of [ENVIRONMENT, ...FILES]) {
    let source;
    try {
      source = await readFile(join(projectDir, file), 'utf8');
    } catch {
      throw new Error(`Could not read ${file}.`);
    }
    const url = source.match(PLACEHOLDER_URL)?.[0];
    if (url) found.push({ file, url });
  }
  return found;
}

async function main() {
  if (process.env.ALLOW_PLACEHOLDER_SITE_URL === '1') return;
  const found = await findPlaceholderUrls(ROOT);
  if (found.length === 0) return;

  console.error('The production build was stopped: the site still uses a placeholder domain.\n');
  for (const { file, url } of found) console.error(`  ${file}: ${url}`);
  console.error(
    '\nSet the real domain (canonical links, sitemap and structured data depend on it):\n' +
      '  npm run configure:seo -- --site-url https://www.your-domain.com\n' +
      '\nTo build anyway (for example in a test pipeline), set ALLOW_PLACEHOLDER_SITE_URL=1.',
  );
  process.exit(1);
}

// Compare real paths: a symlinked project directory must not make the guard silently skip.
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });
}
