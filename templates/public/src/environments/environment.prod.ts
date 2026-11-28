export const environment = {
  production: true,
  envName: 'prod',
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
    // Add the public hostname(s) of the deployed site. Keep localhost to test the image locally.
    allowedHosts: ['localhost', '127.0.0.1'],
  },
};
