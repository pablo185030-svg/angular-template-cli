/** Placeholder name used by every template; replaced with the user's project name. */
export const TEMPLATE_NAME = 'coto-angular-template';

/** Available application types. `value` is also the folder name under `templates/`. */
export const APP_TYPES = [
  {
    value: 'public',
    label: 'Sitio web público',
    hint: 'Renderizado en servidor, páginas home y about',
  },
  {
    value: 'backoffice',
    label: 'Backoffice',
    hint: 'SPA privada con login Keycloak y un ejemplo de ABM',
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
