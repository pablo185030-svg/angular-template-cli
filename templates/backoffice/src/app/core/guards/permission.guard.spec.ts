import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { FakeAuthService } from '@core/auth/testing/fake-auth.service';
import { permissionGuard } from './permission.guard';

describe('permissionGuard', () => {
  function run(granted: ('read' | 'write' | 'manage-roles')[]) {
    const auth = new FakeAuthService();
    auth.grants.set(granted);
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
      permissionGuard('write')({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  }

  it('lets a user with the permission through', () => {
    expect(run(['read', 'write'])).toBe(true);
  });

  it('redirects a user without the permission to the home page', () => {
    expect(run(['read'])).toEqual({ commands: ['/'] });
  });
});
