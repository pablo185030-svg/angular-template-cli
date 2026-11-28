import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MainLayout } from './main-layout';
import { AboutPage } from '@domains/about/pages/about-page/about-page';

describe('MainLayout', () => {
  it('renders the header and footer around the routed page', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: '',
            component: MainLayout,
            children: [{ path: 'acerca-de', component: AboutPage }],
          },
        ]),
      ],
    });

    const harness = await RouterTestingHarness.create('/acerca-de');
    const element = harness.routeNativeElement as HTMLElement;
    const layout = element.querySelector('[data-testid="main-layout"]');

    expect(layout).not.toBeNull();
    expect(layout?.querySelector('[data-testid="header"]')).not.toBeNull();
    expect(layout?.querySelector('main [data-testid="about-page"]')).not.toBeNull();
    expect(layout?.querySelector('[data-testid="footer"]')).not.toBeNull();
  });

  it('starts with a skip link that moves the focus to the main content', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: '',
            component: MainLayout,
            children: [{ path: 'acerca-de', component: AboutPage }],
          },
        ]),
      ],
    });
    const harness = await RouterTestingHarness.create('/acerca-de');
    const layout = (harness.routeNativeElement as HTMLElement).querySelector(
      '[data-testid="main-layout"]',
    ) as HTMLElement;

    const skipLink = layout.querySelector('[data-testid="skip-link"]') as HTMLAnchorElement;
    expect(layout.firstElementChild).toBe(skipLink);
    expect(skipLink.textContent).toContain('Saltar al contenido');
    // Includes the current path: a bare "#main-content" would resolve against <base href="/">.
    expect(skipLink.getAttribute('href')).toBe('/acerca-de#main-content');
    expect(layout.querySelectorAll('main')).toHaveLength(1);

    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    skipLink.dispatchEvent(click);

    expect(click.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(layout.querySelector('main#main-content'));
  });
});
