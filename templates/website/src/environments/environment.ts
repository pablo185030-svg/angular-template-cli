export const environment = {
  production: false,
  envName: 'local',
  // Public base URL of the site, without a trailing slash. Canonical links, social tags, structured
  // data and the crawler files (robots.txt, sitemap.xml, llms.txt) are built from it. Set it with
  // `npm run configure:seo -- --site-url https://www.your-domain.com`.
  siteUrl: 'https://www.example.com',
  // Name shown after the page title (`Inicio | coto-angular-template`) and in structured data.
  siteName: 'coto-angular-template',
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
