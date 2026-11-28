import { match, rejects, strictEqual, throws } from 'node:assert';
import { cp, mkdir, readFile, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { makeTempDir } from '../support/test-helpers.js';
import { applySiteUrl, normalizeSiteUrl } from '../../templates/public/scripts/configure-seo.mjs';

const TEMPLATE = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'templates', 'public');

async function project() {
  const dir = await makeTempDir();
  await mkdir(join(dir, 'src'), { recursive: true });
  await cp(join(TEMPLATE, 'src', 'environments'), join(dir, 'src', 'environments'), { recursive: true });
  await cp(join(TEMPLATE, 'public'), join(dir, 'public'), { recursive: true });
  return dir;
}

const read = (dir, ...parts) => readFile(join(dir, ...parts), 'utf8');
const FILES = ['robots.txt', 'sitemap.xml', 'llms.txt'];

test('sets the site URL in the environments and every crawler file', async () => {
  const dir = await project();

  await applySiteUrl(dir, 'https://www.example.org/');

  for (const file of ['environment.ts', 'environment.prod.ts']) {
    match(await read(dir, 'src', 'environments', file), /siteUrl: 'https:\/\/www\.example\.org'/);
  }
  for (const file of FILES) {
    const content = await read(dir, 'public', file);
    match(content, /https:\/\/www\.example\.org/);
    strictEqual(content.includes('www.example.com'), false);
  }
});

test('can run again with another URL', async () => {
  const dir = await project();

  await applySiteUrl(dir, 'https://one.test');
  await applySiteUrl(dir, 'https://two.test');

  match(await read(dir, 'public', 'sitemap.xml'), /<loc>https:\/\/two\.test\/<\/loc>/);
  strictEqual((await read(dir, 'public', 'sitemap.xml')).includes('one.test'), false);
});

test('rejects values that are not an origin and changes nothing', async () => {
  const dir = await project();
  const before = await read(dir, 'public', 'robots.txt');

  for (const value of ['', 'www.example.org', 'ftp://example.org', 'https://example.org/blog', 'https://example.org/?a=1']) {
    await rejects(applySiteUrl(dir, value));
  }

  strictEqual(await read(dir, 'public', 'robots.txt'), before);
  match(await read(dir, 'src', 'environments', 'environment.ts'), /www\.example\.com/);
});

test('changes nothing when a crawler file is missing', async () => {
  const dir = await project();
  await rm(join(dir, 'public', 'sitemap.xml'));

  await rejects(applySiteUrl(dir, 'https://www.example.org'), /public\/sitemap\.xml/);

  match(await read(dir, 'src', 'environments', 'environment.ts'), /www\.example\.com/);
  match(await read(dir, 'public', 'robots.txt'), /www\.example\.com/);
});

test('normalizes the URL', () => {
  strictEqual(normalizeSiteUrl('https://WWW.Example.org/'), 'https://www.example.org');
  throws(() => normalizeSiteUrl(undefined), /absolute URL/);
});
