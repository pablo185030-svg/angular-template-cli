import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '@env/environment';
import { HomePage } from './home-page';

describe('HomePage structured data', () => {
  afterEach(() =>
    document.head.querySelectorAll('script[data-seo-jsonld]').forEach((script) => script.remove()),
  );

  it('emits one JSON-LD block with the WebSite and the Organization built from the site URL', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });

    TestBed.createComponent(HomePage);

    const scripts = document.head.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);
    const data = JSON.parse(scripts[0].textContent ?? '');
    const types = data['@graph'].map((node: { '@type': string }) => node['@type']);
    expect(types).toEqual(['WebSite', 'Organization']);
    for (const node of data['@graph']) {
      expect(node.url).toBe(`${environment.siteUrl}/`);
      expect(node.name).toBe(environment.siteName);
    }
  });
});
