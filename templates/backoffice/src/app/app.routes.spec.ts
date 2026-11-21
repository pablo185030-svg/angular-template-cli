import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthService } from '@core/auth/auth.service';
import { FakeAuthService } from '@core/auth/testing/fake-auth.service';
import { routes } from './app.routes';

describe('app routes', () => {
  function configure(signedIn: boolean) {
    const auth = new FakeAuthService();
    auth.authenticated.set(signedIn);
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
});
