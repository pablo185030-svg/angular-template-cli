// Served only by the `e2e` build configuration (angular.json). Authentication is mocked so
// e2e runs need no Keycloak server.
export const environment = {
  production: false,
  envName: 'e2e',
  apiBaseUrl: '/api',
  auth: {
    mode: 'mock' as 'keycloak' | 'mock',
    keycloak: {
      url: 'https://keycloak.example.com',
      realm: 'my-realm',
      clientId: 'coto-angular-template',
    },
  },
};
