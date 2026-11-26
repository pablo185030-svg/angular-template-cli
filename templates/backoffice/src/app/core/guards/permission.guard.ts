import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { Permission } from '@core/auth/models/permission.model';

/**
 * Builds a guard that lets users holding the permission through and sends everyone else to the
 * home page.
 * @param {Permission} permission - Permission the route requires.
 */
export function permissionGuard(permission: Permission): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    return auth.hasPermission(permission) || inject(Router).createUrlTree(['/']);
  };
}
