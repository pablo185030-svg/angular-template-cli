export const environment = {
  production: false,
  envName: 'local',
  theme: {
    // Set to true to support the light and dark themes with a toggle in the header (starts
    // light). Or run `npm run configure:theme`. When false the app is always light.
    darkMode: false,
  },
  ssr: {
    // Hostnames the SSR server accepts in the "Host" header. @angular/ssr rejects every host
    // by default to prevent host-header injection, so list each public hostname here.
    allowedHosts: ['localhost', '127.0.0.1'],
  },
};
