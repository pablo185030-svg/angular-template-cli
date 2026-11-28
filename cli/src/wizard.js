import pc from 'picocolors';
import { APP_TYPES, DEFAULT_RENDERING, RENDERING_MODES } from './constants.js';
import {
  validateAppType,
  parseEnvironments,
  parseKeycloakFlag,
  validateKeycloakName,
  validateKeycloakUrl,
  validateProjectName,
  validateRemoteUrl,
  validateRendering,
  validateSiteUrl,
} from './validate.js';

/** A bold label in the given color. */
const label = (color, text) => color(pc.bold(text));

/**
 * One card per rendering mode (meaning, pros, cons, ideal use), shown above the options so the
 * three can be compared at a glance. The select only draws one line per option.
 * @returns {string}
 */
export function renderingGuide() {
  return RENDERING_MODES.map(({ value, meaning, pros, cons, ideal }) =>
    [
      pc.bold(`${value.toUpperCase()} · ${meaning}`),
      `  ${label(pc.green, 'Pros:')} ${pros}`,
      `  ${label(pc.red, 'Contras:')} ${cons}`,
      `  ${label(pc.yellow, 'Ideal:')} ${ideal}`,
    ].join('\n'),
  ).join('\n\n');
}

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
 * @param {{ type?: string, name?: string, outDir?: string, remote?: string, commit?: boolean, install?: boolean, keycloakUrl?: string, keycloakRealm?: string, keycloakClientId?: string, environments?: string, keycloak?: string[], mockApi?: boolean, darkMode?: boolean, rendering?: string, siteUrl?: string }} options.flags
 *   Values given on the command line. `mockApi: false` and `darkMode: true` are the only flag values.
 *   Unanswered questions use their defaults without a terminal (mock API included, light only).
 * @param {string} [options.defaultOutDir] - Location offered by the location question.
 * @param {boolean} options.interactive - Whether prompts may be shown.
 * @param {{ select: Function, text: Function, confirm: Function, isCancel: (value: unknown) => boolean, isBack?: (value: unknown) => boolean }} options.prompts
 * @param {(answers: string[]) => void} [options.redraw] - Called when going back, with the answers so
 *   far as short lines, so a full-screen UI can clear and redraw.
 * @returns {Promise<{ type: string, name: string, darkMode: boolean, mockApi?: boolean, environments?: string[], keycloak?: Record<string, { url: string, realm: string, clientId: string }> }>}
 *   For a backoffice, `environments` lists the extra environments (besides `local` and `prod`) and
 *   `keycloak` maps each environment whose Keycloak settings were provided to them; `mockApi` is
 *   present only for a backoffice.
 */
export async function resolveOptions({ flags, interactive, prompts, defaultOutDir, redraw }) {
  const { type, name } = flags;
  const { keycloakUrl, keycloakRealm, keycloakClientId } = flags;
  const legacyKeycloakFlags = [keycloakUrl, keycloakRealm, keycloakClientId].some((value) => value !== undefined);
  const envKeycloakFlags = (flags.keycloak ?? []).length > 0;
  const keycloakFlags = legacyKeycloakFlags || envKeycloakFlags || flags.environments !== undefined;
  if (legacyKeycloakFlags && envKeycloakFlags) {
    throw new UsageError('No se pueden combinar --keycloak con --keycloak-url, --keycloak-realm ni --keycloak-client-id.');
  }

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
    if (type !== undefined && type !== 'website') {
      throw new UsageError('--rendering solo aplica al tipo website (sitio web).');
    }
  }
  if (flags.siteUrl !== undefined) {
    const error = validateSiteUrl(flags.siteUrl);
    if (error) throw new UsageError(`--site-url: ${error}`);
    if (type !== undefined && type !== 'website') {
      throw new UsageError('--site-url solo aplica al tipo website (sitio web).');
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
          throw new UsageError('--rendering solo aplica al tipo website (sitio web).');
        } else if (flags.siteUrl !== undefined) {
          throw new UsageError('--site-url solo aplica al tipo website (sitio web).');
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
      id: 'environments',
      applies: isBackoffice,
      auto: () => {
        if (flags.environments !== undefined) return { value: environmentsFromFlag(flags.environments) };
        return interactive ? undefined : { value: [] };
      },
      ask: async (answers, canGoBack) => {
        const answer = await ask(
          'text',
          {
            message:
              'Ambientes adicionales de Keycloak, separados por coma (local y prod siempre existen; cada uno tiene su propio Keycloak). Dejalo vacío si no hay más',
            placeholder: 'dev, qa',
            initialValue: answers.environmentsText ?? (answers.environments ?? []).join(', '),
            validate: (value) => parseEnvironments(value).error,
          },
          canGoBack,
        );
        if (answer === BACK) return BACK;
        answers.environmentsText = answer;
        return parseEnvironments(answer).names;
      },
    },
    {
      id: 'keycloak',
      applies: isBackoffice,
      auto: (answers) =>
        keycloakFlags
          ? { value: keycloakFromFlags(flags, answers.name, ['local', ...answers.environments, 'prod']) }
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
              '¿Cómo querés renderizar el sitio?\n\n' +
              renderingGuide() +
              '\n\n' +
              pc.dim(
                'Nota: podés empezar en SSR y pasar a SSG o SPA más adelante con npm run configure:rendering, pero no volver atrás: para eso hay que regenerar el proyecto.',
              ) +
              '\n',
            initialValue: answers.rendering ?? DEFAULT_RENDERING,
            options: RENDERING_MODES.map(({ value, label }) => ({ value, label })),
          },
          canGoBack,
        ),
    },
    {
      id: 'siteUrl',
      applies: isPublic,
      auto: () =>
        flags.siteUrl !== undefined ? { value: flags.siteUrl } : interactive ? undefined : { value: undefined },
      ask: (answers, canGoBack) =>
        ask(
          'text',
          {
            message:
              'Dominio de producción para el SEO (ej.: https://www.mi-sitio.com). ' +
              (answers.rendering === 'spa'
                ? 'Aunque un SPA tiene SEO limitado, el sitio igual publica canonical, sitemap y metadatos con este dominio. '
                : 'Lo usan los links canónicos, el sitemap y los datos estructurados. ') +
              'Enter sin escribir nada lo saltea, pero hace falta antes del build de producción: npm run configure:seo.',
            placeholder: 'https://www.mi-sitio.com',
            initialValue: answers.siteUrl,
            validate: (value) => (value?.trim() ? validateSiteUrl(value.trim()) : undefined),
          },
          canGoBack,
        ).then((value) => (value === BACK ? BACK : (typeof value === 'string' && value.trim()) || undefined)),
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
    const environments = ['local', ...answers.environments, 'prod'];
    // Defaults chain from the closest previous environment that was configured.
    const previous = (env, key) => {
      for (const earlier of environments.slice(0, environments.indexOf(env)).reverse()) {
        if (state[`${earlier}.wanted`] && state[`${earlier}.${key}`] !== undefined) return state[`${earlier}.${key}`];
      }
      return undefined;
    };
    const subSteps = environments.flatMap((env) => [
      {
        id: `${env}.wanted`,
        applies: () => true,
        ask: (_, back) =>
          ask(
            'confirm',
            {
              message:
                env === 'local'
                  ? '¿Querés configurar Keycloak para local ahora? Si no, local arranca en modo demo (después: npm run configure:keycloak)'
                  : `¿Querés configurar Keycloak para ${env} ahora? Si no, queda con valores de ejemplo (después: npm run configure:keycloak -- --env ${env})`,
              initialValue: state[`${env}.wanted`] ?? (env !== 'local' && environments.some((other) => other !== env && state[`${other}.wanted`])),
            },
            back,
          ),
      },
      {
        id: `${env}.url`,
        applies: () => state[`${env}.wanted`] === true,
        ask: (_, back) =>
          ask(
            'text',
            {
              message: `[${env}] URL de Keycloak (la parte previa a /realms)`,
              placeholder: 'https://keycloak.miempresa.com',
              initialValue: state[`${env}.url`] ?? previous(env, 'url'),
              validate: (value) => validateKeycloakUrl(value),
            },
            back,
          ),
      },
      {
        id: `${env}.realm`,
        applies: () => state[`${env}.wanted`] === true,
        ask: (_, back) =>
          ask(
            'text',
            {
              message: `[${env}] Realm`,
              placeholder: 'mi-realm',
              initialValue: state[`${env}.realm`] ?? previous(env, 'realm'),
              validate: (value) => validateKeycloakName(value),
            },
            back,
          ),
      },
      {
        id: `${env}.clientId`,
        applies: () => state[`${env}.wanted`] === true,
        ask: (_, back) =>
          ask(
            'text',
            {
              message: `[${env}] Client id`,
              initialValue: state[`${env}.clientId`] ?? previous(env, 'clientId') ?? answers.name,
              validate: (value) => validateKeycloakName(value),
            },
            back,
          ),
      },
    ]);
    const result = await walk(subSteps, state, { canGoBackAtStart: canGoBack });
    if (result === BACK) return BACK;
    const configured = Object.fromEntries(
      environments
        .filter((env) => state[`${env}.wanted`])
        .map((env) => [env, { url: state[`${env}.url`], realm: state[`${env}.realm`], clientId: state[`${env}.clientId`] }]),
    );
    return Object.keys(configured).length > 0 ? configured : undefined;
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
    return {
      ...common,
      rendering: answers.rendering,
      ...(answers.siteUrl ? { siteUrl: answers.siteUrl } : {}),
      ...outDir,
      ...setup,
    };
  }
  return {
    ...common,
    mockApi: answers.mockApi,
    environments: answers.environments,
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

function environmentsFromFlag(text) {
  const { names, error } = parseEnvironments(text);
  if (error) throw new UsageError(`--environments: ${error}`);
  return names;
}

/** Keycloak settings by environment from the flags: the repeatable `--keycloak` or the legacy trio. */
function keycloakFromFlags(flags, name, environments) {
  const checked = (settings, label) => {
    const error =
      validateKeycloakUrl(settings.url) ?? validateKeycloakName(settings.realm) ?? validateKeycloakName(settings.clientId);
    if (error) throw new UsageError(`Keycloak${label}: ${error} (se necesitan la URL y el realm)`);
    return settings;
  };

  if ((flags.keycloak ?? []).length > 0) {
    const result = {};
    for (const value of flags.keycloak) {
      const parsed = parseKeycloakFlag(value);
      if (parsed.error) throw new UsageError(parsed.error);
      if (!environments.includes(parsed.env)) {
        throw new UsageError(`--keycloak: el ambiente "${parsed.env}" no existe (ambientes: ${environments.join(', ')}).`);
      }
      if (result[parsed.env]) throw new UsageError(`--keycloak: el ambiente "${parsed.env}" está repetido.`);
      result[parsed.env] = checked({ url: parsed.url, realm: parsed.realm, clientId: parsed.clientId ?? name }, ` (${parsed.env})`);
    }
    return result;
  }
  if (flags.keycloakUrl === undefined && flags.keycloakRealm === undefined && flags.keycloakClientId === undefined) {
    return undefined;
  }
  const settings = checked(
    { url: flags.keycloakUrl, realm: flags.keycloakRealm, clientId: flags.keycloakClientId ?? name },
    '',
  );
  return Object.fromEntries(environments.map((env) => [env, { ...settings }]));
}
