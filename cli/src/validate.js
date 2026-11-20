import { APP_TYPES } from './constants.js';

const NAME_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/**
 * Validates a project name.
 * @param {string | undefined} name - The name typed by the user.
 * @returns {string | undefined} An error message, or undefined when the name is valid.
 */
export function validateProjectName(name) {
  if (!name || name.trim() === '') {
    return 'Enter a project name.';
  }
  if (!NAME_PATTERN.test(name)) {
    return 'Use lowercase letters, numbers and single hyphens, starting with a letter (e.g. my-shop).';
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
  return `Unknown app type "${type}". Use one of: ${APP_TYPES.map((t) => t.value).join(', ')}.`;
}
