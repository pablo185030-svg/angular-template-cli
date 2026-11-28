// Converts the server-side rendered project into a statically prerendered one (SSG) or a
// client-only one (SPA). It only works on a project that is still SSR; to go back, use git.
//
//   npm run configure:rendering -- --mode ssg   # prerender every route at build time
//   npm run configure:rendering -- --mode spa   # client-only app, no server, no prerendering
//
// Both modes also replace the Dockerfile and nginx.conf with a static-hosting version and remove
// the Express server. package.json changes, but package-lock.json is not touched: run
// `npm install` afterwards to refresh it.
import { readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export const MODES = ['ssg', 'spa'];

const SSR_ONLY_DEPENDENCIES = ['express', '@types/express'];

/** Writes `source` after applying `replacements`; each one must match or the project is not SSR. */
function replaceAll(source, replacements, file) {
  let result = source;
  for (const [pattern, replacement] of replacements) {
    if (!pattern.test(result)) throw new Error(`Could not find the expected SSR settings in ${file}.`);
    result = result.replace(pattern, replacement);
  }
  return result;
}

const dockerfile = (project) => `# Build first: \`npm run build\` (output in dist/${project}/browser).
# The site is static, so nginx serves it directly and no Node server is needed.
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY ./dist/${project}/browser/ /usr/share/nginx/html/
EXPOSE 80
`;

// Baseline security headers, indented for a location block.
const SECURITY_HEADERS = `        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header X-Frame-Options "SAMEORIGIN" always;`;

const nginxConf = (mode) => `# Static web server for the built site (dist/<project>/browser). Used by the Dockerfile, or
# place it at /etc/nginx/conf.d/default.conf on your own nginx with the build output as the root.
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 256;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml image/svg+xml;

    # Baseline security headers. nginx does not inherit add_header into a location that declares its
    # own add_header, so the locations below repeat them.
${SECURITY_HEADERS.replaceAll('        ', '    ')}

    # Health endpoint for monitoring.
    location = /health {
        access_log off;
        return 200 "ok\\n";
    }

    # Build output files carry a content hash in their name, so they are cached for a year.
    location ~* "-[A-Za-z0-9_-]{8}\\.(?:js|css|mjs)$" {
        expires 1y;
        add_header Cache-Control "public, immutable";
${SECURITY_HEADERS}
        try_files $uri =404;
    }

${
  mode === 'spa'
    ? `    # Every other path is a client-side route: serve the app shell.
    location / {
        add_header Cache-Control "no-cache";
${SECURITY_HEADERS}
        try_files $uri /index.html;
    }`
    : `    # Each prerendered route is a folder with an index.html. Any other path (the not-found
    # page) is rendered in the browser from index.csr.html.
    location / {
        add_header Cache-Control "no-cache";
${SECURITY_HEADERS}
        try_files $uri $uri/index.html /index.csr.html;
    }`
}
}
`;

const SERVER_ROUTES_SSG = `import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
`;

/**
 * Converts an SSR project to the given rendering mode.
 * @param {string} projectDir - Project root (where `angular.json` lives).
 * @param {'ssg' | 'spa'} mode
 */
export async function applyRendering(projectDir, mode) {
  if (!MODES.includes(mode)) throw new Error(`Unknown mode "${mode}". Use one of: ${MODES.join(', ')}.`);

  const angularPath = join(projectDir, 'angular.json');
  const angularSource = await readFile(angularPath, 'utf8');
  if (!/"outputMode":\s*"server"/.test(angularSource)) {
    throw new Error('This project is not server-side rendered (already converted?). Nothing was changed.');
  }
  const project = Object.keys(JSON.parse(angularSource).projects)[0];

  // 1. angular.json: the Express entry goes away in both modes; SPA also drops the server bundle.
  const ssrBlock = /\n\s*"ssr":\s*\{\s*"entry":\s*"src\/server\.ts"\s*\},/;
  const angular =
    mode === 'ssg'
      ? replaceAll(angularSource, [[/"outputMode":\s*"server"/, '"outputMode": "static"'], [ssrBlock, '']], 'angular.json')
      : replaceAll(
          angularSource,
          [[/\n\s*"server":\s*"src\/main\.server\.ts",/, ''], [/\n\s*"outputMode":\s*"server",/, ''], [ssrBlock, '']],
          'angular.json',
        );

  // 2. package.json: drop the Express server (and, for SPA, @angular/ssr) and its run script.
  const packagePath = join(projectDir, 'package.json');
  const pkg = JSON.parse(await readFile(packagePath, 'utf8'));
  delete pkg.scripts?.['serve:ssr'];
  const removed = mode === 'spa' ? [...SSR_ONLY_DEPENDENCIES, '@angular/ssr'] : SSR_ONLY_DEPENDENCIES;
  for (const section of ['dependencies', 'devDependencies']) {
    for (const name of removed) delete pkg[section]?.[name];
  }

  // 3. Source files.
  const serverFiles = ['src/server.ts'];
  if (mode === 'spa') {
    serverFiles.push('src/main.server.ts', 'src/app/app.config.server.ts', 'src/app/app.routes.server.ts');
    const configPath = join(projectDir, 'src', 'app', 'app.config.ts');
    const config = (await readFile(configPath, 'utf8'))
      .replace(/import \{ provideClientHydration, withEventReplay \} from '@angular\/platform-browser';\n/, '')
      .replace(/\n\s*provideClientHydration\(withEventReplay\(\)\),/, '');
    await writeFile(configPath, config);
  } else {
    await writeFile(join(projectDir, 'src', 'app', 'app.routes.server.ts'), SERVER_ROUTES_SSG);
  }
  for (const file of serverFiles) await rm(join(projectDir, file), { force: true });

  // 4. Static hosting.
  await writeFile(join(projectDir, 'Dockerfile'), dockerfile(project));
  await writeFile(join(projectDir, 'nginx.conf'), nginxConf(mode));

  await writeFile(angularPath, angular);
  await writeFile(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
}

async function main() {
  const { values } = parseArgs({ options: { mode: { type: 'string' } } });
  if (!values.mode) throw new Error(`Pass --mode ${MODES.join('|')}.`);
  await applyRendering(ROOT, values.mode);
  console.log(
    values.mode === 'ssg'
      ? 'Rendering set to SSG: every route is prerendered at build time (dist/<project>/browser).'
      : 'Rendering set to SPA: client-only app, no server (dist/<project>/browser).',
  );
  console.log('package.json changed: run `npm install` to refresh package-lock.json.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });
}
