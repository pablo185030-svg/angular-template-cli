export const environment = {
  production: true,
  envName: 'prod',
  theme: {
    // Set to true to support the light and dark themes with a toggle in the header (starts
    // light). Or run `npm run configure:theme`. When false the app is always light.
    darkMode: false,
  },
  ssr: {
    // Add the public hostname(s) of the deployed site. Keep localhost to test the image locally.
    allowedHosts: ['localhost', '127.0.0.1'],
  },
};
