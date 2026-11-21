export const environment = {
  production: false,
  envName: 'local',
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
