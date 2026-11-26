import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { FakeAuthService } from '@core/auth/testing/fake-auth.service';
import { loginPageGuard } from './login-page.guard';

describe('loginPageGuard', () => {
  function run(setup: (auth: FakeAuthService) => void) {
    const auth = new FakeAuthService();
    setup(auth);
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        {
          provide: Router,
          useValue: { createUrlTree: (c: string[]) => ({ commands: c }) as unknown as UrlTree },
        },
      ],
    });
    return TestBed.runInInjectionContext(() =>
      loginPageGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  }

  it('shows the login page to a signed-out user', () => {
    expect(run(() => undefined)).toBe(true);
  });

  it('sends a signed-in user to the home page', () => {
    expect(run((auth) => auth.authenticated.set(true))).toEqual({ commands: ['/'] });
  });

  it('sends everyone to the home page when the app has no login page', () => {
    expect(run((auth) => (auth.hasLoginPage = false))).toEqual({ commands: ['/'] });
  });
});
