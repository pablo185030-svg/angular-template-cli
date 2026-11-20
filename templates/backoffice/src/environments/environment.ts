export const environment = {
  production: false,
  envName: 'local',
  apiBaseUrl: '/api',
  auth: {
    // 'mock' runs the app in demo mode: a fake signed-in user and no Keycloak server needed.
    // 'keycloak' authenticates against the settings below. `npm run configure:keycloak` sets
    // them and switches this to 'keycloak'. Never use 'mock' in a deployed environment.
    mode: 'mock' as 'keycloak' | 'mock',
    keycloak: {
      // Base URL of the Keycloak server, the part before "/realms".
      url: 'https://keycloak.example.com',
      realm: 'my-realm',
      clientId: 'coto-angular-template',
    },
  },
};
