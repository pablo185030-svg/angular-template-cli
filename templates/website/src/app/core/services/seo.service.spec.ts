import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '@env/environment';
import { SeoService } from './seo.service';

describe('SeoService', () => {
  let service: SeoService;
  let head: HTMLHeadElement;

  const metaContent = (selector: string) =>
    head.querySelector(`meta[${selector}]`)?.getAttribute('content');

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    service = TestBed.inject(SeoService);
    head = TestBed.inject(DOCUMENT).head;
  });

  afterEach(() => {
    head
      .querySelectorAll('meta, link[rel="canonical"], script[data-seo-jsonld]')
      .forEach((e) => e.remove());
  });

  it('builds absolute URLs from the site URL', () => {
    expect(service.absoluteUrl('/acerca-de')).toBe(`${environment.siteUrl}/acerca-de`);
    expect(service.absoluteUrl('acerca-de')).toBe(`${environment.siteUrl}/acerca-de`);
  });

  it('writes title, description, canonical, Open Graph and Twitter tags', () => {
    service.update({
      title: 'Acerca de | Sitio',
      description: 'Una descripción',
      path: '/acerca-de',
    });

    const url = `${environment.siteUrl}/acerca-de`;
    expect(document.title).toBe('Acerca de | Sitio');
    expect(metaContent('name="description"')).toBe('Una descripción');
    expect(head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(url);
    expect(metaContent('property="og:title"')).toBe('Acerca de | Sitio');
    expect(metaContent('property="og:description"')).toBe('Una descripción');
    expect(metaContent('property="og:url"')).toBe(url);
    expect(metaContent('property="og:type"')).toBe('website');
    expect(metaContent('property="og:locale"')).toBeTruthy();
    expect(metaContent('name="twitter:card"')).toBe('summary');
    expect(metaContent('name="robots"')).toBeUndefined();
  });

  it('keeps a single canonical link and a single description across updates', () => {
    service.update({ title: 'A', description: 'a', path: '/' });
    service.update({ title: 'B', description: 'b', path: '/acerca-de' });

    expect(head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(head.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(metaContent('name="description"')).toBe('b');
  });

  it('emits image tags only when a page provides an image', () => {
    service.update({ title: 'A', description: 'a', path: '/' });
    expect(head.querySelector('meta[property="og:image"]')).toBeNull();
    expect(metaContent('name="twitter:card"')).toBe('summary');

    service.update({ title: 'A', description: 'a', path: '/', image: 'https://x.test/i.png' });
    expect(metaContent('property="og:image"')).toBe('https://x.test/i.png');
    expect(metaContent('name="twitter:card"')).toBe('summary_large_image');

    service.update({ title: 'A', description: 'a', path: '/' });
    expect(head.querySelector('meta[property="og:image"]')).toBeNull();
  });

  it('marks a page as noindex without a canonical, and clears it on the next page', () => {
    service.update({ title: 'A', description: 'a', path: '/', noindex: true });
    expect(metaContent('name="robots"')).toBe('noindex');
    expect(head.querySelector('link[rel="canonical"]')).toBeNull();

    service.update({ title: 'B', description: 'b', path: '/b' });
    expect(head.querySelector('meta[name="robots"]')).toBeNull();
    expect(head.querySelector('link[rel="canonical"]')).not.toBeNull();
  });

  it('adds JSON-LD safely and removes it on clear', () => {
    service.setJsonLd('a', { '@type': 'WebSite', name: '</script><b>' });

    const scripts = head.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);
    expect(scripts[0].textContent).not.toContain('<');
    expect(JSON.parse(scripts[0].textContent ?? '')['name']).toBe('</script><b>');

    service.clearJsonLd();
    expect(head.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(0);
  });

  it('replaces a JSON-LD block with the same id instead of duplicating it', () => {
    service.setJsonLd('a', { '@type': 'WebSite' });
    service.setJsonLd('a', { '@type': 'Organization' });
    service.setJsonLd('b', { '@type': 'WebPage' });

    const scripts = head.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(2);
    expect(head.querySelector('script[data-seo-jsonld="a"]')?.textContent).toContain(
      'Organization',
    );
  });

  it('drops JSON-LD when a navigation starts', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', children: [] },
          { path: 'x', children: [] },
        ]),
      ],
    });
    const seo = TestBed.inject(SeoService);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/');

    seo.setJsonLd('a', { '@type': 'WebSite' });
    expect(document.head.querySelectorAll('script[data-seo-jsonld]')).toHaveLength(1);

    await router.navigateByUrl('/x');
    expect(document.head.querySelectorAll('script[data-seo-jsonld]')).toHaveLength(0);
  });
});
