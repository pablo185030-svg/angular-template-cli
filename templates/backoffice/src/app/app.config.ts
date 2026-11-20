import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { environment } from '@env/environment';

import { routes } from './app.routes';
import { AuthService } from '@core/auth/auth.service';
import { KeycloakAuthService } from '@core/auth/keycloak-auth.service';
import { MockAuthService } from '@core/auth/mock-auth.service';
import { authInterceptor } from '@core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withComponentInputBinding passes route params (e.g. :id) to component inputs.
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideOAuthClient(),
    {
      provide: AuthService,
      useClass: environment.auth.mode === 'mock' ? MockAuthService : KeycloakAuthService,
    },
    // Resolve the auth state (including the Keycloak redirect back) before the first navigation.
    provideAppInitializer(() => inject(AuthService).init()),
  ],
};
