// Installs, lints, tests, builds and runs e2e for every template, then runs the CLI tests.
// Exits non-zero as soon as any step fails. Meant for CI and for checking a change locally.
//
//   node scripts/verify-templates.mjs                       # everything
//   node scripts/verify-templates.mjs --template backoffice # one template
//   node scripts/verify-templates.mjs --only lint,test      # a subset of steps
//   node scripts/verify-templates.mjs --skip-e2e            # without Playwright
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
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

if (!values['skip-cli'] && !values.template && !selected) {
  const cliDir = join(ROOT, 'cli');
  if (!npm(['install', '--no-audit', '--no-fund'], cliDir)) fail('cli: install');
  if (!npm(['test'], cliDir)) fail('cli: test');
}

console.log(`\nverify passed: ${templates.join(', ')}`);
