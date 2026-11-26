import { APP_TYPES, DEFAULT_RENDERING, RENDERING_MODES } from './constants.js';
import {
  validateAppType,
  validateKeycloakName,
  validateKeycloakUrl,
  validateProjectName,
  validateRemoteUrl,
  validateRendering,
} from './validate.js';

/** Returned by a question when the user asks to go back (Esc). */
const BACK = Symbol('wizard:back');

/** Thrown when the user cancels a prompt. */
export class CancelledError extends Error {}

/** Thrown when options are missing or invalid and no prompt can fix it. */
export class UsageError extends Error {}

/**
 * Resolves the app type and project name, prompting only for what the flags did not provide.
 * In a terminal the user can go back to the previous question (`prompts.isBack`, Esc) to change an
 * answer; Ctrl+C cancels. Without a terminal nothing is asked and the defaults apply.
 * @param {object} options
 * @param {{ type?: string, name?: string, outDir?: string, remote?: string, commit?: boolean, install?: boolean, keycloakUrl?: string, keycloakRealm?: string, keycloakClientId?: string, mockApi?: boolean, darkMode?: boolean, rendering?: string }} options.flags
 *   Values given on the command line. `mockApi: false` and `darkMode: true` are the only flag values.
 *   Unanswered questions use their defaults without a terminal (mock API included, light only).
 * @param {string} [options.defaultOutDir] - Location offered by the location question.
 * @param {boolean} options.interactive - Whether prompts may be shown.
 * @param {{ select: Function, text: Function, confirm: Function, isCancel: (value: unknown) => boolean, isBack?: (value: unknown) => boolean }} options.prompts
 * @param {(answers: string[]) => void} [options.redraw] - Called when going back, with the answers so
 *   far as short lines, so a full-screen UI can clear and redraw.
 * @returns {Promise<{ type: string, name: string, darkMode: boolean, mockApi?: boolean, keycloak?: { url: string, realm: string, clientId: string } }>}
 *   `keycloak` is present only for a backoffice whose Keycloak settings were provided; `mockApi`
 *   is present only for a backoffice.
 */
export async function resolveOptions({ flags, interactive, prompts, defaultOutDir, redraw }) {
  const { type, name } = flags;
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
  if (flags.mockApi === false && type !== undefined && type !== 'backoffice') {
    throw new UsageError('--no-mock-api solo aplica al tipo backoffice.');
  }
  if (flags.rendering !== undefined) {
    const error = validateRendering(flags.rendering);
    if (error) throw new UsageError(error);
    if (type !== undefined && type !== 'public') {
      throw new UsageError('--rendering solo aplica al tipo public (sitio web).');
    }
  }

  if (!interactive && (type === undefined || name === undefined)) {
    throw new UsageError('Faltan --type y/o --name. Ambos son obligatorios sin una terminal.');
  }

  /** Asks one question: cancel (Ctrl+C) throws, back (Esc) returns BACK. */
  const ask = async (method, options, canGoBack) => {
    const answer = await prompts[method]({ ...options, back: canGoBack });
    if (prompts.isBack?.(answer)) return BACK;
    if (prompts.isCancel(answer)) throw new CancelledError();
    return answer;
  };

  const isBackoffice = (answers) => answers.type === 'backoffice';
  const isPublic = (answers) => answers.type !== 'backoffice';
  const confirmStep = (id, { flagValue, fallback, message, initial, applies = () => true }) => ({
    id,
    applies,
    auto: () => (flagValue() !== undefined ? { value: flagValue() } : interactive ? undefined : { value: fallback }),
    ask: (answers, canGoBack) => ask('confirm', { message, initialValue: answers[id] ?? initial }, canGoBack),
  });

  const steps = [
    {
      id: 'type',
      applies: () => true,
      auto: () => (type !== undefined ? { value: type } : undefined),
      ask: (answers, canGoBack) =>
        ask(
          'select',
          {
            message: '¿Qué tipo de app querés crear?',
            initialValue: answers.type,
            options: APP_TYPES.map(({ value, label, hint }) => ({ value, label, hint })),
          },
          canGoBack,
        ),
      after: (value) => {
        if (value !== 'backoffice') {
          if (keycloakFlags) throw new UsageError('Las opciones de Keycloak solo aplican al tipo backoffice.');
          if (flags.mockApi === false) throw new UsageError('--no-mock-api solo aplica al tipo backoffice.');
        } else if (flags.rendering !== undefined) {
          throw new UsageError('--rendering solo aplica al tipo public (sitio web).');
        }
      },
    },
    {
      id: 'name',
      applies: () => true,
      auto: () => (name !== undefined ? { value: name } : undefined),
      ask: (answers, canGoBack) =>
        ask(
          'text',
          {
            message: 'Nombre del proyecto',
            placeholder: 'mi-app',
            initialValue: answers.name,
            validate: (value) => validateProjectName(value),
          },
          canGoBack,
        ),
    },
    {
      id: 'outDir',
      applies: () => true,
      auto: () => (flags.outDir !== undefined ? { value: flags.outDir } : interactive ? undefined : { value: undefined }),
      ask: async (answers, canGoBack) => {
        const answer = await ask(
          'text',
          {
            message:
              '¿Dónde querés crear el proyecto? Se crea una carpeta con el nombre del proyecto dentro de esta ubicación',
            initialValue: answers.outDir ?? defaultOutDir,
            validate: (value) => (value && value.trim() !== '' ? undefined : 'Ingresá una carpeta.'),
          },
          canGoBack,
        );
        return answer === BACK ? BACK : answer.trim();
      },
    },
    {
      id: 'keycloak',
      applies: isBackoffice,
      auto: (answers) =>
        keycloakFlags
          ? { value: keycloakFromFlags(flags, answers.name) }
          : interactive
            ? undefined
            : { value: undefined },
      ask: (answers, canGoBack) => askKeycloak(answers, canGoBack),
    },
    confirmStep('mockApi', {
      applies: isBackoffice,
      flagValue: () => flags.mockApi,
      fallback: true,
      initial: true,
      message:
        '¿Querés incluir la API mock? Es un servidor local (npm run mock:api) que simula la API de productos con datos de ejemplo, para que el ABM funcione sin backend. ' +
        'El ABM es solo un ejemplo para que lo reemplaces por tus pantallas. ' +
        'Si no la incluís, los productos se cargan desde public/mock/products.json y los cambios se pierden al recargar.',
    }),
    confirmStep('darkMode', {
      flagValue: () => flags.darkMode,
      fallback: false,
      initial: false,
      message:
        '¿Querés soportar modo oscuro? Se agrega un botón en el header para alternar entre el tema claro y el oscuro (arranca en claro). ' +
        'Si no, la app queda solo con el tema claro.',
    }),
    {
      id: 'rendering',
      applies: isPublic,
      auto: () =>
        flags.rendering !== undefined
          ? { value: flags.rendering }
          : interactive
            ? undefined
            : { value: DEFAULT_RENDERING },
      ask: (answers, canGoBack) =>
        ask(
          'select',
          {
            message:
              '¿Cómo querés renderizar el sitio? SSR (servidor Node), SSG (páginas prearmadas en el build) o SPA (solo cliente, sin SEO). ' +
              'Después se puede convertir con npm run configure:rendering mientras el proyecto siga en SSR.',
            initialValue: answers.rendering ?? DEFAULT_RENDERING,
            options: RENDERING_MODES.map(({ value, label, hint }) => ({ value, label, hint })),
          },
          canGoBack,
        ),
    },
    {
      id: 'remote',
      applies: () => true,
      auto: () => {
        if (flags.remote === undefined) return interactive ? undefined : { value: undefined };
        const error = validateRemoteUrl(flags.remote);
        if (error) throw new UsageError(`--remote: ${error}`);
        return { value: flags.remote };
      },
      ask: (answers, canGoBack) => askRemote(answers, canGoBack),
    },
    confirmStep('commit', {
      flagValue: () => flags.commit,
      fallback: false,
      initial: true,
      message: '¿Querés crear un commit inicial con los archivos generados?',
    }),
    confirmStep('install', {
      flagValue: () => flags.install,
      fallback: false,
      initial: false,
      message:
        '¿Querés instalar las dependencias ahora (npm install)? Necesita acceso al registry privado de @coto-dev/ui-kit desde tu red; ' +
        'si falla, el proyecto igual queda generado.',
    }),
  ];

  // Sub-questions of the Keycloak and remote steps keep their own answers so Esc steps through them.
  const sub = { keycloak: {}, remote: {} };

  async function askKeycloak(answers, canGoBack) {
    const state = sub.keycloak;
    const subSteps = [
      {
        id: 'wanted',
        applies: () => true,
        ask: (_, back) =>
          ask(
            'confirm',
            {
              message:
                '¿Querés configurar Keycloak ahora? Si no, el backoffice arranca en modo demo (podés hacerlo después con npm run configure:keycloak)',
              initialValue: state.wanted ?? false,
            },
            back,
          ),
      },
      {
        id: 'url',
        applies: () => state.wanted === true,
        ask: (_, back) =>
          ask(
            'text',
            {
              message: 'URL de Keycloak (la parte previa a /realms)',
              placeholder: 'https://keycloak.miempresa.com',
              initialValue: state.url,
              validate: (value) => validateKeycloakUrl(value),
            },
            back,
          ),
      },
      {
        id: 'realm',
        applies: () => state.wanted === true,
        ask: (_, back) =>
          ask(
            'text',
            { message: 'Realm', placeholder: 'mi-realm', initialValue: state.realm, validate: (value) => validateKeycloakName(value) },
            back,
          ),
      },
      {
        id: 'clientId',
        applies: () => state.wanted === true,
        ask: (_, back) =>
          ask(
            'text',
            { message: 'Client id', initialValue: state.clientId ?? answers.name, validate: (value) => validateKeycloakName(value) },
            back,
          ),
      },
    ];
    const result = await walk(subSteps, state, { canGoBackAtStart: canGoBack });
    if (result === BACK) return BACK;
    return state.wanted ? { url: state.url, realm: state.realm, clientId: state.clientId } : undefined;
  }

  async function askRemote(_answers, canGoBack) {
    const state = sub.remote;
    const subSteps = [
      {
        id: 'has',
        applies: () => true,
        ask: (_, back) =>
          ask(
            'confirm',
            {
              message: '¿Ya tenés un repositorio git creado para este proyecto? Lo conecto como "origin" (no se sube nada)',
              initialValue: state.has ?? false,
            },
            back,
          ),
      },
      {
        id: 'url',
        applies: () => state.has === true,
        ask: (_, back) =>
          ask(
            'text',
            {
              message: 'URL del repositorio',
              placeholder: 'git@github.com:mi-org/mi-app.git',
              initialValue: state.url,
              validate: (value) => validateRemoteUrl(value),
            },
            back,
          ),
      },
    ];
    const result = await walk(subSteps, state, { canGoBackAtStart: canGoBack });
    if (result === BACK) return BACK;
    return state.has ? state.url : undefined;
  }

  /**
   * Walks `list` in order, asking what is not decided yet. Esc moves to the previous asked step;
   * on the first asked step it returns BACK when `canGoBackAtStart` (a sub-walk) and re-asks otherwise.
   */
  async function walk(list, answers, { canGoBackAtStart = false, onBack } = {}) {
    const asked = [];
    let index = 0;
    while (index < list.length) {
      const step = list[index];
      if (!step.applies(answers)) {
        index++;
        continue;
      }
      const decided = step.auto?.(answers);
      if (decided) {
        answers[step.id] = decided.value;
        step.after?.(decided.value);
        index++;
        continue;
      }
      const canGoBack = asked.length > 0 || canGoBackAtStart;
      const value = await step.ask(answers, canGoBack);
      if (value === BACK) {
        if (asked.length > 0) {
          index = asked.pop();
          onBack?.(answers);
        } else if (canGoBackAtStart) {
          return BACK;
        }
        continue;
      }
      answers[step.id] = value;
      step.after?.(value);
      asked.push(index);
      index++;
    }
    return undefined;
  }

  const answers = {};
  await walk(steps, answers, {
    onBack: (current) => redraw?.(describeAnswers(current)),
  });

  const common = { type: answers.type, name: answers.name, darkMode: answers.darkMode };
  const setup = {
    ...(answers.remote ? { remote: answers.remote } : {}),
    commit: answers.commit,
    install: answers.install,
  };
  const outDir = answers.outDir ? { outDir: answers.outDir } : {};
  if (answers.type !== 'backoffice') {
    return { ...common, rendering: answers.rendering, ...outDir, ...setup };
  }
  return {
    ...common,
    mockApi: answers.mockApi,
    ...outDir,
    ...(answers.keycloak ? { keycloak: answers.keycloak } : {}),
    ...setup,
  };
}

/** Short lines describing the answers given so far, shown when going back. */
function describeAnswers({ type, name, outDir }) {
  const label = APP_TYPES.find((entry) => entry.value === type)?.label;
  return [label && `Tipo: ${label}`, name && `Nombre: ${name}`, outDir && `Carpeta: ${outDir}`].filter(Boolean);
}

function keycloakFromFlags(flags, name) {
  const settings = {
    url: flags.keycloakUrl,
    realm: flags.keycloakRealm,
    clientId: flags.keycloakClientId ?? name,
  };
  const error =
    validateKeycloakUrl(settings.url) ?? validateKeycloakName(settings.realm) ?? validateKeycloakName(settings.clientId);
  if (error) throw new UsageError(`Keycloak: ${error} (se necesitan --keycloak-url y --keycloak-realm)`);
  return settings;
}
