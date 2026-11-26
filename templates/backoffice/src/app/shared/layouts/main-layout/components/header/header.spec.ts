import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthService } from '@core/auth/auth.service';
import { FakeAuthService } from '@core/auth/testing/fake-auth.service';
import { environment } from '@env/environment';
import { Header } from './header';
import { HomePage } from '@domains/home/pages/home-page/home-page';
import { AboutPage } from '@domains/about/pages/about-page/about-page';

describe('Header', () => {
  async function setup(url = '/') {
    const auth = new FakeAuthService();
    auth.authenticated.set(true);
    auth.name.set('Ana Pérez');
    auth.role.set('lectura');
    TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        { provide: AuthService, useValue: auth },
        provideRouter([
          { path: '', pathMatch: 'full', component: HomePage },
          { path: 'acerca-de', component: AboutPage },
        ]),
      ],
    });
    await RouterTestingHarness.create(url);
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    return { auth, fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('shows the user name, initials and role badge', async () => {
    const { element, auth } = await setup();

    const text = (id: string) =>
      element.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
    expect(text('user-name')).toBe('Ana Pérez');
    expect(text('role-badge')).toBe('lectura');
    expect(element.querySelector('.header__avatar')?.textContent?.trim()).toBe('AP');

    auth.role.set('');
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="role-badge"]')).toBeNull();
  });

  it('renders navigation links to Home, Products and About', async () => {
    const { element } = await setup();

    const link = (id: string) => element.querySelector<HTMLAnchorElement>(`[data-testid="${id}"]`);

    expect(link('nav-home')?.getAttribute('href')).toBe('/');
    expect(link('nav-products')?.getAttribute('href')).toBe('/productos');
    expect(link('nav-about')?.getAttribute('href')).toBe('/acerca-de');
  });

  it('marks only the link of the current page as active', async () => {
    const { fixture, element } = await setup('/acerca-de');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      element
        .querySelector('[data-testid="nav-about"]')
        ?.classList.contains('header__link--active'),
    ).toBe(true);
    expect(
      element.querySelector('[data-testid="nav-home"]')?.classList.contains('header__link--active'),
    ).toBe(false);
  });

  it('navigates to /about when the About link is clicked', async () => {
    const { fixture, element } = await setup('/');

    element.querySelector<HTMLAnchorElement>('[data-testid="nav-about"]')?.click();
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/acerca-de');
  });

  it('shows the signed-in user name', async () => {
    const { element } = await setup();

    expect(element.querySelector('[data-testid="user-name"]')?.textContent?.trim()).toBe(
      'Ana Pérez',
    );
  });

  it('shows a demo badge and the logout button in demo mode', async () => {
    TestBed.resetTestingModule();
    const auth = new FakeAuthService();
    auth.isDemo = true;
    auth.authenticated.set(true);
    auth.name.set('Usuario demo');
    TestBed.configureTestingModule({
      imports: [Header],
      providers: [{ provide: AuthService, useValue: auth }, provideRouter([])],
    });
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[data-testid="demo-badge"]')?.textContent?.trim()).toBe(
      'Modo demo',
    );
    expect(element.querySelector('[data-testid="logout"]')).not.toBeNull();
  });

  it('shows the roles link only to users who can manage roles', async () => {
    const { auth, fixture, element } = await setup();
    expect(element.querySelector('[data-testid="nav-roles"]')).toBeNull();

    auth.grants.set(['read', 'write', 'manage-roles']);
    fixture.detectChanges();

    expect(element.querySelector('[data-testid="nav-roles"]')).not.toBeNull();
    expect(element.querySelector('[data-testid="drawer-nav-roles"]')).not.toBeNull();
  });

  it('hides the demo badge when a real identity provider is used', async () => {
    const { element } = await setup();

    expect(element.querySelector('[data-testid="demo-badge"]')).toBeNull();
  });

  it('logs out when the logout button is clicked', async () => {
    const { auth, element } = await setup();

    element.querySelector<HTMLButtonElement>('[data-testid="logout"]')?.click();

    expect(auth.logoutCalls).toBe(1);
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

    it('contains the user area and logs out from the drawer', async () => {
      const { auth, fixture, element } = await setup();

      toggle(element).click();
      fixture.detectChanges();

      expect(
        drawer(element).querySelector('[data-testid="drawer-user-name"]')?.textContent?.trim(),
      ).toBe('Ana Pérez');
      drawer(element).querySelector<HTMLButtonElement>('[data-testid="drawer-logout"]')!.click();
      expect(auth.logoutCalls).toBe(1);
    });

    it('shows the demo badge and logout inside the drawer in demo mode', async () => {
      TestBed.resetTestingModule();
      const auth = new FakeAuthService();
      auth.isDemo = true;
      auth.authenticated.set(true);
      TestBed.configureTestingModule({
        imports: [Header],
        providers: [{ provide: AuthService, useValue: auth }, provideRouter([])],
      });
      const fixture = TestBed.createComponent(Header);
      fixture.detectChanges();
      const element = fixture.nativeElement as HTMLElement;

      expect(drawer(element).querySelector('[data-testid="drawer-demo-badge"]')).not.toBeNull();
      expect(drawer(element).querySelector('[data-testid="drawer-logout"]')).not.toBeNull();
    });
  });
});
