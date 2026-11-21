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

  describe('drawer', () => {
    const drawer = (element: HTMLElement) =>
      element.querySelector<HTMLElement>('[data-testid="drawer"]')!;
    const toggle = (element: HTMLElement) =>
      element.querySelector<HTMLButtonElement>('[data-testid="menu-toggle"]')!;
    const root = (element: HTMLElement) =>
      element.querySelector<HTMLElement>('[data-testid="drawer-root"]')!;

    afterEach(() => {
      document.body.classList.remove('no-scroll');
      vi.unstubAllGlobals();
    });

    it('starts closed and opens when the hamburger button is clicked', async () => {
      const { fixture, element } = await setup();

      expect(root(element).classList.contains('drawer--open')).toBe(false);
      expect(drawer(element).hasAttribute('inert')).toBe(true);

      toggle(element).click();
      fixture.detectChanges();

      expect(root(element).classList.contains('drawer--open')).toBe(true);
      expect(drawer(element).hasAttribute('inert')).toBe(false);
      expect(toggle(element).getAttribute('aria-expanded')).toBe('true');
      expect(document.body.classList.contains('no-scroll')).toBe(true);
      expect(drawer(element).querySelector('[data-testid="drawer-nav-about"]')).not.toBeNull();
    });

    it('closes on backdrop click, Escape and link activation', async () => {
      const { fixture, element } = await setup();
      const open = () => {
        toggle(element).click();
        fixture.detectChanges();
      };
      const isOpen = () => root(element).classList.contains('drawer--open');

      open();
      element.querySelector<HTMLElement>('[data-testid="drawer-backdrop"]')!.click();
      fixture.detectChanges();
      expect(isOpen()).toBe(false);

      open();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();
      expect(isOpen()).toBe(false);

      open();
      element.querySelector<HTMLElement>('[data-testid="drawer-nav-about"]')!.click();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(isOpen()).toBe(false);
      expect(TestBed.inject(Router).url).toBe('/acerca-de');
      expect(document.body.classList.contains('no-scroll')).toBe(false);
    });

    it('closes when the viewport grows to the desktop layout', async () => {
      let listener: (event: { matches: boolean }) => void = () => undefined;
      vi.stubGlobal('matchMedia', () => ({
        matches: false,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: (_: string, fn: typeof listener) => (listener = fn),
        removeEventListener: () => undefined,
      }));
      const { fixture, element } = await setup();

      toggle(element).click();
      fixture.detectChanges();
      listener({ matches: true });
      fixture.detectChanges();

      expect(root(element).classList.contains('drawer--open')).toBe(false);
    });

    it('shows the theme toggle inside the drawer when dark mode is enabled', async () => {
      environment.theme.darkMode = true;
      const { element } = await setup();

      expect(drawer(element).querySelector('[data-testid="theme-toggle"]')).not.toBeNull();
      environment.theme.darkMode = false;
    });
  });
});
