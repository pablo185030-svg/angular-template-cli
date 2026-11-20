import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { FakeAuthService } from '@core/auth/testing/fake-auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  function run(url: string) {
    const auth = new FakeAuthService();
    TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: auth }] });
    return {
      auth,
      run: () =>
        TestBed.runInInjectionContext(() =>
          authGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
        ),
    };
  }

  it('lets an authenticated user through without starting a login', () => {
    const { auth, run: guard } = run('/products');
    auth.authenticated.set(true);

    expect(guard()).toBe(true);
    expect(auth.loginCalls).toEqual([]);
  });

  it('blocks an unauthenticated user and starts the login for the requested route', () => {
    const { auth, run: guard } = run('/products/new');

    expect(guard()).toBe(false);
    expect(auth.loginCalls).toEqual(['/products/new']);
  });
});
