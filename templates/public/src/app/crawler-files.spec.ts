import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { environment } from '@env/environment';
import { routes } from './app.routes';

// The crawler files are plain files in `public/` so every rendering mode and host serves them.
const publicFile = (name: string) => readFileSync(join(process.cwd(), 'public', name), 'utf8');

/** URLs of the pages that must be in the sitemap: titled, indexable, not the catch-all. */
function indexableUrls(): string[] {
  return (routes[0].children ?? [])
    .filter(
      (route) =>
        route.path !== '**' &&
        route.title &&
        !(route.data?.['seo'] as { noindex?: boolean })?.noindex,
    )
    .map((route) => `${environment.siteUrl}/${route.path ?? ''}`);
}

describe('crawler files', () => {
  const sitemapUrls = [...publicFile('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => match[1],
  );

  it('lists every indexable route in the sitemap, and nothing else', () => {
    expect([...sitemapUrls].sort()).toEqual(indexableUrls().sort());
  });

  it('references the sitemap from robots.txt and allows all crawlers', () => {
    const robots = publicFile('robots.txt');

    expect(robots).toContain(`Sitemap: ${environment.siteUrl}/sitemap.xml`);
    expect(robots).toMatch(/^User-agent: \*\nAllow: \/$/m);
  });

  it('describes the site in llms.txt with links to its pages', () => {
    const llms = publicFile('llms.txt');

    expect(llms).toMatch(/^# \S+/);
    expect(llms).toContain(`(${environment.siteUrl}/)`);
  });

  it.each(['robots.txt', 'sitemap.xml', 'llms.txt'])(
    'only uses URLs of the configured site in %s',
    (name) => {
      // The sitemap XML namespace is a fixed identifier, not a URL of the site.
      const content = publicFile(name).replace(/xmlns="[^"]*"/, '');
      const urls = content.match(/https?:\/\/[^\s<>)"]+/g) ?? [];

      expect(urls.length).toBeGreaterThan(0);
      for (const url of urls) expect(url.startsWith(environment.siteUrl)).toBe(true);
    },
  );
});
