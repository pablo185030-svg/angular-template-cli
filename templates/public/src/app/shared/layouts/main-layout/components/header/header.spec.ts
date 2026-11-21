import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { environment } from '@env/environment';
import { Header } from './header';
import { HomePage } from '@domains/home/pages/home-page/home-page';
import { AboutPage } from '@domains/about/pages/about-page/about-page';

describe('Header', () => {
  async function setup(url = '/') {
    TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter([
          { path: '', pathMatch: 'full', component: HomePage },
          { path: 'acerca-de', component: AboutPage },
        ]),
      ],
    });
    await RouterTestingHarness.create(url);
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('renders navigation links to Home and About', async () => {
    const { element } = await setup();

    const home = element.querySelector<HTMLAnchorElement>('[data-testid="nav-home"]');
    const about = element.querySelector<HTMLAnchorElement>('[data-testid="nav-about"]');

    expect(home?.textContent?.trim()).toBe('Inicio');
    expect(home?.getAttribute('href')).toBe('/');
    expect(about?.textContent?.trim()).toBe('Acerca de');
    expect(about?.getAttribute('href')).toBe('/acerca-de');
  });

  it('marks only the link of the current page as active', async () => {
    const { fixture, element } = await setup('/acerca-de');
    await fixture.whenStable();
    fixture.detectChanges();

    const home = element.querySelector('[data-testid="nav-home"]');
    const about = element.querySelector('[data-testid="nav-about"]');

    expect(about?.classList.contains('header__link--active')).toBe(true);
    expect(home?.classList.contains('header__link--active')).toBe(false);
  });

  it('navigates to /about when the About link is clicked', async () => {
    const { fixture, element } = await setup('/');

    element.querySelector<HTMLAnchorElement>('[data-testid="nav-about"]')?.click();
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/acerca-de');
  });

  describe('theme toggle', () => {
    afterEach(() => {
      environment.theme.darkMode = false;
    });

    it('is hidden when dark mode is disabled', async () => {
      environment.theme.darkMode = false;
      const { element } = await setup();

      expect(element.querySelector('[data-testid="theme-toggle"]')).toBeNull();
    });

    it('is shown when dark mode is enabled', async () => {
      environment.theme.darkMode = true;
      const { element } = await setup();

      expect(element.querySelector('[data-testid="theme-toggle"]')).not.toBeNull();
    });
  });
});
