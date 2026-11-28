import { APP_TYPES, RENDERING_MODES } from './constants.js';

const NAME_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/**
 * Validates a project name.
 * @param {string | undefined} name - The name typed by the user.
 * @returns {string | undefined} An error message, or undefined when the name is valid.
 */
export function validateProjectName(name) {
  if (!name || name.trim() === '') {
    return 'Ingresá un nombre de proyecto.';
  }
  if (!NAME_PATTERN.test(name)) {
    return 'Usá minúsculas, números y guiones simples, empezando con una letra (ej.: mi-tienda).';
  }
  return undefined;
}

/**
 * Validates an application type.
 * @param {string | undefined} type - The type given by flag or prompt.
 * @returns {string | undefined} An error message, or undefined when the type is valid.
 */
export function validateAppType(type) {
  if (APP_TYPES.some((appType) => appType.value === type)) {
    return undefined;
  }
  return `Tipo de app desconocido "${type}". Usá uno de: ${APP_TYPES.map((t) => t.value).join(', ')}.`;
}

/**
 * Validates the Keycloak base URL (the part before "/realms").
 * @param {string | undefined} url
 * @returns {string | undefined} An error message, or undefined when valid.
 */
export function validateKeycloakUrl(url) {
  if (!url || !/^https?:\/\/[^\s']+$/.test(url)) {
    return 'Ingresá una URL que empiece con http:// o https:// (la parte previa a "/realms").';
  }
  return undefined;
}

/**
 * Validates a Keycloak realm name or client id.
 * @param {string | undefined} value
 * @returns {string | undefined} An error message, or undefined when valid.
 */
export function validateKeycloakName(value) {
  if (!value || !/^[^\s'/]+$/.test(value)) {
    return 'Ingresá un valor sin espacios, comillas ni barras.';
  }
  return undefined;
}

/**
 * Validates a git remote URL.
 * @param {string | undefined} url
 * @returns {string | undefined} An error message, or undefined when valid.
 */
export function validateRemoteUrl(url) {
  if (!url || !/^\S+$/.test(url)) {
    return 'Ingresá la URL del repositorio, sin espacios (ej.: git@github.com:mi-org/mi-app.git).';
  }
  return undefined;
}

/**
 * Validates a rendering mode.
 * @param {string | undefined} mode - The mode given by flag.
 * @returns {string | undefined} An error message, or undefined when valid.
 */
export function validateRendering(mode) {
  if (RENDERING_MODES.some((entry) => entry.value === mode)) return undefined;
  return `Modo de renderizado desconocido "${mode}". Usá uno de: ${RENDERING_MODES.map((entry) => entry.value).join(', ')}.`;
}

/**
 * Validates the production domain of a public website: an absolute http(s) origin, the same rule
 * as the template's `configure:seo` script.
 * @param {string | undefined} value
 * @returns {string | undefined} An error message, or undefined when valid.
 */
export function validateSiteUrl(value) {
  let url;
  try {
    url = new URL(value ?? '');
  } catch {
    return `"${value ?? ''}" no es una URL absoluta. Usá algo como https://www.mi-sitio.com.`;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return 'La URL del sitio tiene que empezar con http:// o https://.';
  }
  if (url.pathname !== '/' || url.search || url.hash) {
    return 'Ingresá solo el origen del sitio, sin ruta, query ni hash (ej.: https://www.mi-sitio.com).';
  }
  return undefined;
}

/**
 * Validates the name of an extra environment (`local` and `prod` always exist).
 * @param {string | undefined} name
 * @returns {string | undefined} An error message, or undefined when valid.
 */
export function validateEnvironmentName(name) {
  if (!name || !/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) {
    return `Nombre de ambiente inválido "${name ?? ''}". Usá minúsculas y guiones (ej.: dev, qa, pre-prod).`;
  }
  if (['local', 'prod', 'e2e', 'development', 'production'].includes(name)) {
    return `"${name}" ya existe o está reservado; local y prod siempre están y e2e es solo de pruebas.`;
  }
  return undefined;
}

/**
 * Parses a comma-separated list of extra environment names.
 * @param {string | undefined} text - For example `"dev, qa"`; empty means none.
 * @returns {{ names: string[], error?: string }} The names, or the first error found.
 */
export function parseEnvironments(text) {
  const names = (text ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
  for (const [index, name] of names.entries()) {
    const error = validateEnvironmentName(name);
    if (error) return { names: [], error };
    if (names.indexOf(name) !== index) return { names: [], error: `El ambiente "${name}" está repetido.` };
  }
  return { names };
}

/**
 * Parses a `--keycloak <env>=<url>,<realm>[,<clientId>]` value.
 * @param {string} value
 * @returns {{ env?: string, url?: string, realm?: string, clientId?: string, error?: string }}
 */
export function parseKeycloakFlag(value) {
  const separator = value.indexOf('=');
  const parts = separator < 0 ? [] : value.slice(separator + 1).split(',');
  if (separator <= 0 || parts.length < 2 || parts.length > 3) {
    return { error: `--keycloak "${value}": el formato es <ambiente>=<url>,<realm>[,<client-id>].` };
  }
  const [url, realm, clientId] = parts;
  return { env: value.slice(0, separator), url, realm, ...(clientId === undefined ? {} : { clientId }) };
}
