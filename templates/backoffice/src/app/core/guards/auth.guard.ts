import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';

/**
 * Lets authenticated users through. Anyone else is sent to the Keycloak login and returns to
 * the requested route afterwards.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);

  if (auth.isAuthenticated()) {
    return true;
  }

  auth.login(state.url);
  return false;
};
