// Installs, lints, tests, builds and runs e2e for every template, then runs the CLI tests.
// Exits non-zero as soon as any step fails. Meant for CI and for checking a change locally.
//
//   node scripts/verify-templates.mjs                       # everything
//   node scripts/verify-templates.mjs --template backoffice # one template
//   node scripts/verify-templates.mjs --only lint,test      # a subset of steps
//   node scripts/verify-templates.mjs --skip-e2e            # without Playwright
//   node scripts/verify-templates.mjs --skip-variant        # without the generated backoffice variant
//
// A full run also generates a backoffice with the wizard's non-default answers
// (`--no-mock-api --dark-mode --environments qa`) and a public site converted to SSG and to SPA
// (`--rendering ssg|spa`), and runs the same steps on each.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const STEPS = {
  install: ['ci', '--no-audit', '--no-fund'],
  lint: ['run', 'lint'],
  test: ['test', '--', '--watch=false'],
  build: ['run', 'build'],
  e2e: ['run', 'test:e2e'],
};

const { values } = parseArgs({
  options: {
    template: { type: 'string' },
    only: { type: 'string' },
    'skip-e2e': { type: 'boolean' },
    'templates-dir': { type: 'string' },
    'skip-cli': { type: 'boolean' },
    'skip-variant': { type: 'boolean' },
  },
});

const templatesDir = values['templates-dir'] ?? join(ROOT, 'templates');
const selected = values.only?.split(',').map((step) => step.trim());
const stepNames = Object.keys(STEPS).filter(
  (step) => (!selected || selected.includes(step)) && !(values['skip-e2e'] && step === 'e2e'),
);

function npm(args, cwd) {
  console.log(`\n$ npm ${args.join(' ')}   (${cwd})`);
  const result = spawnSync('npm', args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, HUSKY: '0' }, // do not let husky touch this repository's git config
  });
  return result.status === 0;
}

function fail(message) {
  console.error(`\nverify failed: ${message}`);
  process.exit(1);
}

if (!existsSync(templatesDir)) fail(`templates directory not found: ${templatesDir}`);

const templates = readdirSync(templatesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => !values.template || name === values.template);

if (templates.length === 0) fail(`no template found${values.template ? ` named "${values.template}"` : ''}`);

for (const template of templates) {
  for (const step of stepNames) {
    if (!npm(STEPS[step], join(templatesDir, template))) fail(`${template}: ${step}`);
  }
}

const fullRun = !values.template && !selected;
const cliDir = join(ROOT, 'cli');

if (!values['skip-cli'] && fullRun) {
  if (!npm(['install', '--no-audit', '--no-fund'], cliDir)) fail('cli: install');
  if (!npm(['test'], cliDir)) fail('cli: test');
}

// Generate a backoffice with the non-default wizard answers and verify it like a template.
if (!values['skip-variant'] && fullRun && templates.includes('backoffice')) {
  if (!existsSync(join(cliDir, 'node_modules'))) fail('variant: run `npm install --prefix cli` first');
  const outDir = mkdtempSync(join(tmpdir(), 'coto-verify-'));
  const generated = spawnSync(
    process.execPath,
    [
      join(cliDir, 'index.js'),
      ...['--type', 'backoffice', '--name', 'verify-variant', '--yes', '--no-mock-api', '--dark-mode'],
      ...['--environments', 'qa'],
      ...['--keycloak', 'qa=https://keycloak-qa.example.com,qa-realm'],
      ...['--out', outDir],
    ],
    { stdio: 'inherit' },
  );
  if (generated.status !== 0) fail('variant: generation');
  const projectDir = join(outDir, 'verify-variant');
  for (const step of stepNames) {
    if (!npm(STEPS[step], projectDir)) fail(`backoffice (--no-mock-api --dark-mode): ${step}`);
  }
  // The extra environment must build with its own configuration.
  if (stepNames.includes('build') && !npm(['run', 'build:qa'], projectDir)) {
    fail('backoffice (--environments qa): build:qa');
  }
  rmSync(outDir, { recursive: true, force: true });
}

// Public site converted to each rendering mode. The conversion edits package.json but not the
// lockfile, so these projects use `npm install` instead of `npm ci`.
if (!values['skip-variant'] && fullRun && templates.includes('public')) {
  if (!existsSync(join(cliDir, 'node_modules'))) fail('variant: run `npm install --prefix cli` first');
  for (const rendering of ['ssg', 'spa']) {
    const outDir = mkdtempSync(join(tmpdir(), 'coto-verify-'));
    const generated = spawnSync(
      process.execPath,
      [
        join(cliDir, 'index.js'),
        ...['--type', 'public', '--name', `verify-${rendering}`, '--yes', '--rendering', rendering],
        ...['--out', outDir],
      ],
      { stdio: 'inherit' },
    );
    if (generated.status !== 0) fail(`public (--rendering ${rendering}): generation`);
    const projectDir = join(outDir, `verify-${rendering}`);
    for (const step of stepNames) {
      const args = step === 'install' ? ['install', '--no-audit', '--no-fund'] : STEPS[step];
      if (!npm(args, projectDir)) fail(`public (--rendering ${rendering}): ${step}`);
    }
    rmSync(outDir, { recursive: true, force: true });
  }
}

console.log(`\nverify passed: ${templates.join(', ')}`);
