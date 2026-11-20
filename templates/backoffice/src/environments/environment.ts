export const environment = {
  production: false,
  envName: 'local',
  apiBaseUrl: '/api',
  auth: {
    // 'keycloak' authenticates against the server below. 'mock' skips Keycloak entirely and
    // signs in a fake user; it exists for the e2e configuration only and must never be used in
    // a deployed environment.
    mode: 'keycloak' as 'keycloak' | 'mock',
    keycloak: {
      // Base URL of the Keycloak server, the part before "/realms".
      url: 'https://keycloak.example.com',
      realm: 'my-realm',
      clientId: 'coto-angular-template',
    },
  },
};
