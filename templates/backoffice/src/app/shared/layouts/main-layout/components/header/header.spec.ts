import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthService } from '@core/auth/auth.service';
import { FakeAuthService } from '@core/auth/testing/fake-auth.service';
import { Header } from './header';
import { HomePage } from '@domains/home/pages/home-page/home-page';
import { AboutPage } from '@domains/about/pages/about-page/about-page';

describe('Header', () => {
  async function setup(url = '/') {
    const auth = new FakeAuthService();
    auth.authenticated.set(true);
    auth.name.set('Ana Pérez');
    TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        { provide: AuthService, useValue: auth },
        provideRouter([
          { path: '', pathMatch: 'full', component: HomePage },
          { path: 'about', component: AboutPage },
        ]),
      ],
    });
    await RouterTestingHarness.create(url);
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    return { auth, fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('renders navigation links to Home, Products and About', async () => {
    const { element } = await setup();

    const link = (id: string) => element.querySelector<HTMLAnchorElement>(`[data-testid="${id}"]`);

    expect(link('nav-home')?.getAttribute('href')).toBe('/');
    expect(link('nav-products')?.getAttribute('href')).toBe('/products');
    expect(link('nav-about')?.getAttribute('href')).toBe('/about');
  });

  it('marks only the link of the current page as active', async () => {
    const { fixture, element } = await setup('/about');
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

    expect(TestBed.inject(Router).url).toBe('/about');
  });

  it('shows the signed-in user name', async () => {
    const { element } = await setup();

    expect(element.querySelector('[data-testid="user-name"]')?.textContent?.trim()).toBe(
      'Ana Pérez',
    );
  });

  it('logs out when the logout button is clicked', async () => {
    const { auth, element } = await setup();

    element.querySelector<HTMLButtonElement>('[data-testid="logout"]')?.click();

    expect(auth.logoutCalls).toBe(1);
  });
});
