/** Placeholder name used by every template; replaced with the user's project name. */
export const TEMPLATE_NAME = 'coto-angular-template';

/** Available application types. `value` is also the folder name under `templates/`. */
export const APP_TYPES = [
  {
    value: 'website',
    label: 'Website',
    hint: 'Sitio web público',
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

/** Rendering modes of the public website. `ssr` is what the template ships. */
export const RENDERING_MODES = [
  {
    value: 'ssr',
    label: 'SSR (Server-Side Rendering)',
    meaning: 'Server-Side Rendering, renderizado en un servidor Node en cada pedido',
    pros: 'SEO completo, contenido siempre al día, 404 real, se ve bien al compartir el link, contenido personalizado por usuario',
    cons: 'Hosting más caro y con más mantenimiento (servidor Node corriendo)',
    ideal: 'ecommerce, catálogos o noticias, con contenido que cambia seguido',
  },
  {
    value: 'ssg',
    label: 'SSG (Static Site Generation)',
    meaning: 'Static Site Generation, páginas prearmadas una vez en el build',
    pros: 'SEO completo, el más rápido, barato y seguro, se publica en cualquier hosting, se ve bien al compartir el link',
    cons: 'El contenido cambia solo al volver a compilar y desplegar; sin 404 real',
    ideal: 'sitios institucionales, landings, documentación o blogs con contenido estable',
  },
  {
    value: 'spa',
    label: 'SPA (Single Page Application)',
    meaning: 'Single Page Application, todo se renderiza en el navegador',
    pros: 'Hosting simple y barato, navegación fluida tipo app',
    cons: 'SEO limitado (los buscadores ven una página vacía hasta que ejecutan JavaScript) sin 404 real, al compartir el link no se ve título ni imagen',
    ideal: 'herramientas o apps detrás de un login, donde el SEO no importa',
  },
];

export const DEFAULT_RENDERING = 'ssr';
