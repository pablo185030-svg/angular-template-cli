/** Placeholder name used by every template; replaced with the user's project name. */
export const TEMPLATE_NAME = 'coto-angular-template';

/** Available application types. `value` is also the folder name under `templates/`. */
export const APP_TYPES = [
  {
    value: 'public',
    label: 'Website',
    hint: 'Sitio web público',
  },
  {
    value: 'backoffice',
    label: 'Backoffice',
    hint: 'SPA privada con login Keycloak, roles y un ejemplo de ABM',
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

/** Rendering modes of the public website. `ssr` is what the template ships. */
export const RENDERING_MODES = [
  { value: 'ssr', label: 'SSR', hint: 'Se renderiza en un servidor Node: buen SEO, requiere un runtime Node (recomendado)' },
  { value: 'ssg', label: 'SSG', hint: 'Páginas prearmadas en el build: buen SEO y alcanza con un hosting estático (nginx)' },
  { value: 'spa', label: 'SPA', hint: 'Solo cliente: el hosting más simple, pero sin SEO (los buscadores ven una página vacía)' },
];

export const DEFAULT_RENDERING = 'ssr';
