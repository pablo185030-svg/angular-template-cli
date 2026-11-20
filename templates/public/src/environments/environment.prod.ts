export const environment = {
  production: true,
  envName: 'prod',
  ssr: {
    // Add the public hostname(s) of the deployed site. Keep localhost to test the image locally.
    allowedHosts: ['localhost', '127.0.0.1'],
  },
};
