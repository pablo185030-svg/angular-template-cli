import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, TitleStrategy } from '@angular/router';
import { environment } from '@env/environment';
import { PageTitleStrategy } from './page-title.strategy';

describe('PageTitleStrategy', () => {
  const routes = [
    {
      path: '',
      title: 'Inicio',
      data: { seo: { description: 'Descripción inicio' } },
      children: [],
    },
    { path: 'a', title: 'Página A', data: { seo: { description: 'Descripción A' } }, children: [] },
    {
      path: 'oculta',
      title: 'Oculta',
      data: { seo: { description: 'x', noindex: true } },
      children: [],
    },
    { path: 'sin-seo', title: 'Sin SEO', children: [] },
  ];

  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: TitleStrategy, useExisting: PageTitleStrategy },
      ],
    });
    router = TestBed.inject(Router);
  });

  const description = () =>
    document.head.querySelector('meta[name="description"]')?.getAttribute('content');
  const canonical = () =>
    document.head.querySelector('link[rel="canonical"]')?.getAttribute('href');

  it('sets title, description and canonical from the route, and updates them on navigation', async () => {
    await router.navigateByUrl('/');
    expect(document.title).toBe(`Inicio | ${environment.siteName}`);
    expect(description()).toBe('Descripción inicio');
    expect(canonical()).toBe(`${environment.siteUrl}/`);

    await router.navigateByUrl('/a?x=1#frag');
    expect(document.title).toBe(`Página A | ${environment.siteName}`);
    expect(description()).toBe('Descripción A');
    expect(canonical()).toBe(`${environment.siteUrl}/a`);
  });

  it('marks noindex routes', async () => {
    await router.navigateByUrl('/oculta');

    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex',
    );
    expect(canonical()).toBeUndefined();
  });

  it('still sets the title when a route declares no SEO data', async () => {
    await router.navigateByUrl('/sin-seo');

    expect(document.title).toBe(`Sin SEO | ${environment.siteName}`);
    expect(description()).toBeUndefined();
  });
});
