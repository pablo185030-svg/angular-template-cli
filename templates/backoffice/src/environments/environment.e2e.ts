// Served only by the `e2e` build configuration (angular.json). Authentication is mocked so
// e2e runs need no Keycloak server.
export const environment = {
  production: false,
  envName: 'e2e',
  apiBaseUrl: '/api',
  api: {
    // 'http' calls the products API (the mock API in development, see `npm run mock:api`).
    // 'json' serves the sample products from `public/mock/products.json` and keeps changes in
    // browser memory (lost on reload); no server is needed.
    mode: 'http' as 'http' | 'json',
  },
  theme: {
    // Set to true to support the light and dark themes with a toggle in the header (starts
    // light). Or run `npm run configure:theme`. When false the app is always light.
    darkMode: false,
  },
  auth: {
    mode: 'mock' as 'keycloak' | 'mock',
    authConfig: {
      // Keycloak realm URL: <server>/realms/<realm>.
      issuer: 'https://keycloak.example.com/realms/my-realm',
      clientId: 'coto-angular-template',
      redirectUri: window.location.origin + '/',
      silentRefreshRedirectUri: window.location.origin + '/silent-refresh.html',
      responseType: 'code',
      scope: 'openid profile email',
      requireHttps: true,
      timeoutFactor: 0.9,
    },
  },
};
