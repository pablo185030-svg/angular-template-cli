import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';

/**
 * Guards `/login`: it only exists when the app has its own login page, and a signed-in user has
 * no reason to see it. Both cases go to the home page.
 */
export const loginPageGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return (auth.hasLoginPage && !auth.isAuthenticated()) || inject(Router).createUrlTree(['/']);
};
