import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '@env/environment';
import { AuthService } from '@core/auth/auth.service';

/** True when the request targets the configured API base URL (and not a lookalike prefix). */
function isApiRequest(url: string): boolean {
  const base = environment.apiBaseUrl;
  return url === base || url.startsWith(`${base}/`);
}

/** Adds the access token to requests sent to the configured API base URL, and only to those. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getAccessToken();

  if (!token || !isApiRequest(req.url)) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
