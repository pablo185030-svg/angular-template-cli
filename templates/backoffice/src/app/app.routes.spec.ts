import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthService } from '@core/auth/auth.service';
import { FakeAuthService } from '@core/auth/testing/fake-auth.service';
import { Permission } from '@core/auth/models/permission.model';
import { routes } from './app.routes';

describe('app routes', () => {
  function configure(
    signedIn: boolean,
    permissions: Permission[] = ['read', 'write', 'manage-roles'],
  ) {
    const auth = new FakeAuthService();
    auth.authenticated.set(signedIn);
    auth.grants.set(permissions);
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: auth }, provideRouter(routes)],
    });
    return auth;
  }

  async function navigate(url: string) {
    configure(true);
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
  });

  it('starts the login instead of showing any page when signed out', async () => {
    const auth = configure(false);

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/acerca-de');

    expect(auth.loginCalls).toEqual(['/acerca-de']);
    expect(
      (harness.routeNativeElement as HTMLElement | null)?.querySelector(
        '[data-testid="about-page"]',
      ) ?? null,
    ).toBeNull();
  });

  it('shows the login page without the layout when signed out', async () => {
    configure(false);

    const harness = await RouterTestingHarness.create('/login');
    const element = harness.routeNativeElement as HTMLElement;

    expect(element.querySelector('[data-testid="login-page"]')).not.toBeNull();
    expect(element.querySelector('[data-testid="header"]')).toBeNull();
  });

  it('redirects a signed-in user from the login page to the home page', async () => {
    configure(true);

    const harness = await RouterTestingHarness.create('/login');

    expect(TestBed.inject(Router).url).toBe('/');
    expect(
      (harness.routeNativeElement as HTMLElement).querySelector('[data-testid="home-page"]'),
    ).not.toBeNull();
  });

  it('redirects a read-only user from the create product route to the home page', async () => {
    configure(true, ['read']);

    await RouterTestingHarness.create('/productos/nuevo');

    expect(TestBed.inject(Router).url).toBe('/');
  });
});
