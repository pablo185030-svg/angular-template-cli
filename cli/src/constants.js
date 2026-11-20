/** Placeholder name used by every template; replaced with the user's project name. */
export const TEMPLATE_NAME = 'coto-angular-template';

/** Available application types. `value` is also the folder name under `templates/`. */
export const APP_TYPES = [
  {
    value: 'public',
    label: 'Public website',
    hint: 'Server-side rendered, home + about pages',
  },
  {
    value: 'backoffice',
    label: 'Backoffice',
    hint: 'Private SPA with Keycloak login and a CRUD example',
  },
];

/** Directories never copied from a template into a new project. */
export const EXCLUDED_NAMES = new Set([
  'node_modules',
  'dist',
  '.git',
  '.angular',
  'playwright-report',
  'test-results',
  'coverage',
]);
