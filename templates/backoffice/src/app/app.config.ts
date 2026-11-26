import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
import {
  ApplicationConfig,
  inject,
  LOCALE_ID,
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
import { HttpProductsService } from '@domains/products/services/http-products.service';
import { JsonProductsService } from '@domains/products/services/json-products.service';
import { ProductsService } from '@domains/products/services/products.service';
import { HttpRolesService } from '@domains/roles/services/http-roles.service';
import { JsonRolesService } from '@domains/roles/services/json-roles.service';
import { RolesService } from '@domains/roles/services/roles.service';

registerLocaleData(localeEsAr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: LOCALE_ID, useValue: 'es-AR' },
    // withComponentInputBinding passes route params (e.g. :id) to component inputs.
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideOAuthClient(),
    {
      provide: AuthService,
      useClass: environment.auth.mode === 'mock' ? MockAuthService : KeycloakAuthService,
    },
    // 'json' serves the sample products from a JSON file and keeps changes in browser memory.
    {
      provide: ProductsService,
      useClass: environment.api.mode === 'json' ? JsonProductsService : HttpProductsService,
    },
    {
      provide: RolesService,
      useClass: environment.api.mode === 'json' ? JsonRolesService : HttpRolesService,
    },
    // Resolve the auth state (including the Keycloak redirect back) before the first navigation.
    provideAppInitializer(() => inject(AuthService).init()),
  ],
};
