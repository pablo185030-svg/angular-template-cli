export const environment = {
  production: true,
  envName: 'prod',
  apiBaseUrl: '/api',
  auth: {
    // Production always authenticates against Keycloak. Set the real values below (or run
    // `npm run configure:keycloak`) before deploying.
    mode: 'keycloak' as 'keycloak' | 'mock',
    keycloak: {
      url: 'https://keycloak.example.com',
      realm: 'my-realm',
      clientId: 'coto-angular-template',
    },
  },
};
