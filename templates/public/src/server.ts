import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { environment } from '@env/environment';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();

const angularApp = new AngularNodeAppEngine({
  allowedHosts: environment.ssr.allowedHosts,
});

// Build output files carry a content hash in their name (`main-LTTKLN65.js`), so they never change.
const HASHED_ASSET = /-[A-Za-z0-9_-]{8}\.(?:js|css|mjs)$/;

app.disable('x-powered-by');

// Baseline security headers on every response.
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

// Liveness probe. Declared first and answered without touching the Angular engine, so a
// probe does not trigger a full server-side render.
app.get('/health', (_req, res) => {
  res.status(200).send('ok');
});

app.use(
  express.static(browserDistFolder, {
    index: false,
    redirect: false,
    // Hashed assets are cached for a year. Everything else (robots.txt, sitemap.xml, llms.txt,
    // the favicon...) is revalidated, so a change is never hidden behind a long cache.
    setHeaders: (res, path) => {
      res.setHeader(
        'Cache-Control',
        HASHED_ASSET.test(path) ? 'public, max-age=31536000, immutable' : 'no-cache',
      );
    },
  }),
);

app.use((req, res, next) => {
  // Rendered pages change with the content: let clients revalidate them.
  res.setHeader('Cache-Control', 'no-cache');
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

// Start the server when this module is the entry point. Listens on PORT, default 4000.
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

// Request handler used by the Angular CLI (dev server and build).
export const reqHandler = createNodeRequestHandler(app);
