import { APP_TYPES } from './constants.js';

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
