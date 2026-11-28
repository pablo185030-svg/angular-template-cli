// Sets the public URL of the site. Canonical links, social tags and structured data read it from
// the environment files; robots.txt, sitemap.xml and llms.txt are plain files, so they are
// rewritten here. Nothing is written unless every file can be updated.
//
//   npm run configure:seo -- --site-url https://www.your-domain.com
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CRAWLER_FILES = ['robots.txt', 'sitemap.xml', 'llms.txt'];
const SITE_URL_SETTING = /siteUrl:\s*'([^']*)'/;

/**
 * Validates a site URL and returns its normalized form (origin only, no trailing slash).
 * @param {string | undefined} value - The value passed to `--site-url`.
 * @returns {string} For example `https://www.example.org`.
 */
export function normalizeSiteUrl(value) {
  let url;
  try {
    url = new URL(value ?? '');
  } catch {
    throw new Error(`"${value ?? ''}" is not an absolute URL. Use something like https://www.example.org.`);
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('The site URL must start with http:// or https://.');
  }
  if (url.pathname !== '/' || url.search || url.hash) {
    throw new Error('The site URL must be only the origin (no path, query or hash).');
  }
  return url.origin;
}

/**
 * Sets `siteUrl` in every environment file and in the crawler files of the project.
 * @param {string} projectDir - Project root (where `src/` and `public/` live).
 * @param {string} siteUrl - Absolute http(s) URL of the site.
 * @returns {Promise<void>}
 */
export async function applySiteUrl(projectDir, siteUrl) {
  const newUrl = normalizeSiteUrl(siteUrl);
  const writes = [];

  const environments = join(projectDir, 'src', 'environments');
  const files = (await readdir(environments)).filter((file) => /^environment.*\.ts$/.test(file));
  if (files.length === 0) throw new Error('Could not find the environment files.');

  let previousUrl;
  for (const file of files) {
    const path = join(environments, file);
    const source = await readFile(path, 'utf8');
    const match = SITE_URL_SETTING.exec(source);
    if (!match) throw new Error(`Could not find siteUrl in ${file}.`);
    if (file === 'environment.prod.ts') previousUrl = match[1];
    writes.push([path, source.replace(SITE_URL_SETTING, `siteUrl: '${newUrl}'`)]);
  }
  if (!previousUrl) throw new Error('Could not find siteUrl in environment.prod.ts.');
  const previous = previousUrl.replace(/\/+$/, '');

  for (const file of CRAWLER_FILES) {
    const path = join(projectDir, 'public', file);
    let source;
    try {
      source = await readFile(path, 'utf8');
    } catch {
      throw new Error(`Could not find public/${file}.`);
    }
    if (!source.includes(previous)) throw new Error(`Could not find ${previous} in public/${file}.`);
    writes.push([path, source.replaceAll(previous, newUrl)]);
  }

  for (const [path, content] of writes) await writeFile(path, content);
}

async function main() {
  const { values } = parseArgs({ options: { 'site-url': { type: 'string' } } });
  if (!values['site-url']) throw new Error('Pass --site-url https://www.your-domain.com.');
  const siteUrl = normalizeSiteUrl(values['site-url']);
  await applySiteUrl(ROOT, siteUrl);
  console.log(`Site URL set to ${siteUrl} in the environments, robots.txt, sitemap.xml and llms.txt.`);
  console.log('Next: add the hostname to ssr.allowedHosts in src/environments/environment.prod.ts.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });
}
