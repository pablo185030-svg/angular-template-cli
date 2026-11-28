import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';

describe('app routes', () => {
  async function navigate(url: string) {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    const harness = await RouterTestingHarness.create(url);
    return harness.routeNativeElement as HTMLElement;
  }

  it('shows the home page at "/"', async () => {
    const element = await navigate('/');

    expect(element.querySelector('[data-testid="home-page"]')).not.toBeNull();
    expect(element.querySelector('[data-testid="header"]')).not.toBeNull();
  });

  it('shows the about page at "/acerca-de"', async () => {
    const element = await navigate('/acerca-de');

    expect(element.querySelector('[data-testid="about-page"]')).not.toBeNull();
    expect(element.querySelector('[data-testid="footer"]')).not.toBeNull();
  });

  it('shows the not-found page inside the layout for an unknown path', async () => {
    const element = await navigate('/does-not-exist');

    expect(element.querySelector('main [data-testid="not-found-page"]')).not.toBeNull();
    expect(element.querySelector('[data-testid="header"]')).not.toBeNull();
    expect(element.querySelector('[data-testid="home-page"]')).toBeNull();
  });

  describe('SEO metadata', () => {
    // Every routed page (the leaves of the route tree) must declare a Spanish title and description.
    const pages = (routes[0].children ?? []).filter((route) => route.component === undefined);

    it('declares at least one page', () => {
      expect(pages.length).toBeGreaterThan(0);
    });

    it.each(pages.map((route) => [route.path ?? '', route] as const))(
      'route "%s" has a title and a meta description',
      (_path, route) => {
        const seo = route.data?.['seo'] as { description?: string } | undefined;

        expect(typeof route.title === 'string' && route.title.length > 0).toBe(true);
        expect(seo?.description?.trim().length ?? 0).toBeGreaterThan(0);
      },
    );
  });

  describe('page structure', () => {
    it.each(['/', '/acerca-de', '/does-not-exist'])('"%s" has exactly one h1', async (url) => {
      const element = await navigate(url);

      expect(element.querySelectorAll('h1')).toHaveLength(1);
    });
  });
});
