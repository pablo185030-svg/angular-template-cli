export const environment = {
  production: true,
  envName: 'prod',
  apiBaseUrl: '/api',
  auth: {
    mode: 'keycloak' as 'keycloak' | 'mock',
    keycloak: {
      url: 'https://keycloak.example.com',
      realm: 'my-realm',
      clientId: 'coto-angular-template',
    },
  },
};
