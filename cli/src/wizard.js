import { APP_TYPES } from './constants.js';
import {
  validateAppType,
  validateKeycloakName,
  validateKeycloakUrl,
  validateProjectName,
} from './validate.js';

/** Thrown when the user cancels a prompt. */
export class CancelledError extends Error {}

/** Thrown when options are missing or invalid and no prompt can fix it. */
export class UsageError extends Error {}

/**
 * Resolves the app type and project name, prompting only for what the flags did not provide.
 * @param {object} options
 * @param {{ type?: string, name?: string, keycloakUrl?: string, keycloakRealm?: string, keycloakClientId?: string }} options.flags
 *   Values given on the command line.
 * @param {boolean} options.interactive - Whether prompts may be shown.
 * @param {{ select: Function, text: Function, confirm: Function, isCancel: (value: unknown) => boolean }} options.prompts
 * @returns {Promise<{ type: string, name: string, keycloak?: { url: string, realm: string, clientId: string } }>}
 *   `keycloak` is present only for a backoffice whose Keycloak settings were provided.
 */
export async function resolveOptions({ flags, interactive, prompts }) {
  let { type, name } = flags;
  const { keycloakUrl, keycloakRealm, keycloakClientId } = flags;
  const keycloakFlags = [keycloakUrl, keycloakRealm, keycloakClientId].some((value) => value !== undefined);

  if (type !== undefined) {
    const error = validateAppType(type);
    if (error) throw new UsageError(error);
  }
  if (name !== undefined) {
    const error = validateProjectName(name);
    if (error) throw new UsageError(error);
  }
  if (keycloakFlags && type !== undefined && type !== 'backoffice') {
    throw new UsageError('Las opciones de Keycloak solo aplican al tipo backoffice.');
  }

  if (!interactive && (type === undefined || name === undefined)) {
    throw new UsageError('Faltan --type y/o --name. Ambos son obligatorios sin una terminal.');
  }

  if (type === undefined) {
    const answer = await prompts.select({
      message: '¿Qué tipo de app querés crear?',
      options: APP_TYPES.map(({ value, label, hint }) => ({ value, label, hint })),
    });
    if (prompts.isCancel(answer)) throw new CancelledError();
    type = answer;
  }

  if (name === undefined) {
    const answer = await prompts.text({
      message: 'Nombre del proyecto',
      placeholder: 'mi-app',
      validate: (value) => validateProjectName(value),
    });
    if (prompts.isCancel(answer)) throw new CancelledError();
    name = answer;
  }

  if (type !== 'backoffice') {
    if (keycloakFlags) throw new UsageError('Las opciones de Keycloak solo aplican al tipo backoffice.');
    return { type, name };
  }

  const keycloak = await resolveKeycloak({ flags, name, interactive, prompts });
  return keycloak ? { type, name, keycloak } : { type, name };
}

async function resolveKeycloak({ flags, name, interactive, prompts }) {
  const { keycloakUrl, keycloakRealm, keycloakClientId } = flags;

  if (keycloakUrl !== undefined || keycloakRealm !== undefined || keycloakClientId !== undefined) {
    const settings = { url: keycloakUrl, realm: keycloakRealm, clientId: keycloakClientId ?? name };
    const error =
      validateKeycloakUrl(settings.url) ??
      validateKeycloakName(settings.realm) ??
      validateKeycloakName(settings.clientId);
    if (error) throw new UsageError(`Keycloak: ${error} (se necesitan --keycloak-url y --keycloak-realm)`);
    return settings;
  }

  if (!interactive) return undefined;

  const wanted = await prompts.confirm({
    message:
      '¿Querés configurar Keycloak ahora? Si no, el backoffice arranca en modo demo (podés hacerlo después con npm run configure:keycloak)',
    initialValue: false,
  });
  if (prompts.isCancel(wanted)) throw new CancelledError();
  if (!wanted) return undefined;

  const ask = async (options) => {
    const answer = await prompts.text(options);
    if (prompts.isCancel(answer)) throw new CancelledError();
    return answer;
  };
  const url = await ask({
    message: 'URL de Keycloak (la parte previa a /realms)',
    placeholder: 'https://keycloak.miempresa.com',
    validate: (value) => validateKeycloakUrl(value),
  });
  const realm = await ask({
    message: 'Realm',
    placeholder: 'mi-realm',
    validate: (value) => validateKeycloakName(value),
  });
  const clientId = await ask({
    message: 'Client id',
    initialValue: name,
    validate: (value) => validateKeycloakName(value),
  });
  return { url, realm, clientId };
}
