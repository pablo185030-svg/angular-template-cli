import { match, ok, rejects, strictEqual } from 'node:assert';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import { addRenderingFiles, makeTempDir } from '../support/test-helpers.js';
import { applyRendering } from '../../templates/public/scripts/configure-rendering.mjs';

const exists = (path) => access(path).then(() => true, () => false);
const read = (dir, file) => readFile(join(dir, file), 'utf8');

async function project() {
  const dir = await makeTempDir();
  await addRenderingFiles(dir);
  return dir;
}

test('SSG prerenders statically and drops the Express server', async () => {
  const dir = await project();

  await applyRendering(dir, 'ssg');

  const angular = await read(dir, 'angular.json');
  match(angular, /"outputMode": "static"/);
  match(angular, /"server": "src\/main\.server\.ts"/, 'prerendering still needs the server bundle entry');
  ok(!/src\/server\.ts/.test(angular));
  JSON.parse(angular);
  match(await read(dir, 'src/app/app.routes.server.ts'), /RenderMode\.Prerender/);
  strictEqual(await exists(join(dir, 'src/server.ts')), false);
  strictEqual(await exists(join(dir, 'src/main.server.ts')), true);
  const pkg = JSON.parse(await read(dir, 'package.json'));
  ok(!pkg.dependencies.express && !pkg.devDependencies['@types/express'] && !pkg.scripts['serve:ssr']);
  ok(pkg.dependencies['@angular/ssr'], 'SSG keeps @angular/ssr for prerendering');
  match(await read(dir, 'nginx.conf'), /try_files \$uri \$uri\/index\.html \/index\.csr\.html;/);
  const dockerfile = await read(dir, 'Dockerfile');
  match(dockerfile, /FROM nginx:alpine/);
  match(dockerfile, /dist\/coto-angular-template\/browser/);
});

test('SPA removes every server file and dependency and falls back to index.html', async () => {
  const dir = await project();

  await applyRendering(dir, 'spa');

  const angular = await read(dir, 'angular.json');
  ok(!/outputMode|main\.server|"ssr"|server\.ts/.test(angular));
  JSON.parse(angular);
  for (const file of ['src/server.ts', 'src/main.server.ts', 'src/app/app.config.server.ts', 'src/app/app.routes.server.ts']) {
    strictEqual(await exists(join(dir, file)), false, file);
  }
  const pkg = JSON.parse(await read(dir, 'package.json'));
  ok(!pkg.dependencies['@angular/ssr'] && !pkg.dependencies.express);
  const config = await read(dir, 'src/app/app.config.ts');
  ok(!/Hydration/.test(config));
  match(config, /provideRouter\(routes\)/);
  match(await read(dir, 'nginx.conf'), /try_files \$uri \/index\.html;/);
});

test('refuses a project that is no longer SSR and changes nothing', async () => {
  const dir = await project();
  await applyRendering(dir, 'ssg');
  const before = await read(dir, 'angular.json');

  await rejects(applyRendering(dir, 'spa'), /not server-side rendered/);
  strictEqual(await read(dir, 'angular.json'), before);
});

test('rejects unknown modes, including ssr', async () => {
  const dir = await project();

  await rejects(applyRendering(dir, 'ssr'), /Unknown mode/);
  await rejects(applyRendering(dir, 'hybrid'), /Unknown mode/);
  match(await read(dir, 'angular.json'), /"outputMode": "server"/);
});
