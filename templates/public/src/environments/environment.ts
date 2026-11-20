export const environment = {
  production: false,
  envName: 'local',
  ssr: {
    // Hostnames the SSR server accepts in the "Host" header. @angular/ssr rejects every host
    // by default to prevent host-header injection, so list each public hostname here.
    allowedHosts: ['localhost', '127.0.0.1'],
  },
};
