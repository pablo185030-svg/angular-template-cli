import * as clack from '@clack/prompts';
import { MULTISELECT_INSTRUCTIONS, SELECT_INSTRUCTIONS } from '@clack/prompts';
import { readFileSync } from 'node:fs';
import pc from 'picocolors';
import { FRAME_COUNT, headerLines } from './mascot.js';
import { createScreen } from './screen.js';

/** The project version lives in the repository's root package.json. */
const { version: VERSION } = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
const TITLE = 'COTO - CoE Desarrollo | Asistente para la creación de microservicio frontend';
const SUBTITLE = 'Generá un proyecto Angular nuevo a partir de un template';
/** What the generated projects are built with, shown under the title. */
const STACK = 'Stack: Angular 22 · Material Design 3 · @coto-dev/ui-kit · SCSS + BEM';
const FRAME_MS = 120;
const SPLASH_FRAMES = FRAME_COUNT;
/** clack's key hints are in English and exported as mutable arrays: translate them in place. */
SELECT_INSTRUCTIONS.splice(0, SELECT_INSTRUCTIONS.length, `${pc.dim('↑/↓')} para navegar`, `${pc.dim('Enter:')} confirmar`);
MULTISELECT_INSTRUCTIONS.splice(
  0,
  MULTISELECT_INSTRUCTIONS.length,
  `${pc.dim('↑/↓')} para navegar`,
  `${pc.dim('Espacio:')} seleccionar`,
  `${pc.dim('Enter:')} confirmar`,
);

const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

/**
 * Builds the summary shown when a project is ready.
 * @param {{ name: string, type: string, targetDir: string }} project
 * @returns {{ title: string, lines: string[] }}
 */
export function buildSummary({
  name,
  type,
  targetDir,
  cdPath = name,
  keycloakConfigured = false,
  mockApi = true,
  darkMode = false,
  rendering,
  remote,
  committed = false,
  installed = false,
}) {
  const commands = [`cd ${cdPath}`];
  if (!installed) commands.push('npm install');
  if (type === 'backoffice' && mockApi) commands.push('npm run mock:api   # en una segunda terminal');
  commands.push('npm start');

  const mockApiLines =
    type === 'backoffice' && !mockApi
      ? [
          'Sin API mock: el ABM carga public/mock/products.json y los cambios solo viven en la memoria',
          'del navegador. Para usar un backend real, poné api.mode en \'http\' en los environments.',
          '',
        ]
      : [];

  const remoteLines = remote
    ? [
        `Repositorio remoto "origin" conectado: ${remote}`,
        committed
          ? 'No se subió nada. Para publicar el código: git push -u origin main'
          : 'No se subió nada. Cuando hagas el primer commit: git push -u origin main',
        '',
      ]
    : [];

  const renderingLines =
    type !== 'public' || !rendering
      ? []
      : rendering === 'ssr'
        ? [
            'Renderizado: SSR (servidor Node). Para pasar a SSG o SPA:',
            'npm run configure:rendering -- --mode ssg   (o spa; solo funciona mientras siga en SSR)',
            '',
          ]
        : [
            `Renderizado: ${rendering.toUpperCase()}. El build queda en dist/${name}/browser y se sirve con nginx (ver Dockerfile).`,
            'Para volver a SSR, regenerá el proyecto o usá git.',
            '',
          ];

  const themeLines = darkMode
    ? [
        'Modo oscuro habilitado: el header tiene un botón para alternar (arranca en claro).',
        'Para quitarlo: npm run configure:theme -- --no-dark-mode',
        '',
      ]
    : [
        'Solo tema claro. Para habilitar el modo oscuro: npm run configure:theme -- --dark-mode',
        '',
      ];

  const sampleLines =
    type === 'backoffice'
      ? [
          'El ABM de productos es solo de prueba: un ejemplo para reemplazar o quitar,',
          'no una funcionalidad real del backoffice.',
          '',
        ]
      : [];

  const keycloakLines =
    type !== 'backoffice'
      ? []
      : keycloakConfigured
        ? [
            'Keycloak configurado. Agregá http://localhost:4200/* como redirect URI del client.',
            '',
          ]
        : [
            'Keycloak sin configurar: el backoffice arranca en modo demo con login de prueba (admin / 1234).',
            'Para conectarlo después: npm run configure:keycloak',
            '',
          ];

  return {
    title: `Proyecto "${name}" creado en ${targetDir}`,
    lines: [
      'Próximos pasos:',
      ...commands.map((command) => `  ${command}`),
      '',
      ...remoteLines,
      ...keycloakLines,
      ...sampleLines,
      ...mockApiLines,
      ...renderingLines,
      ...themeLines,
      '@coto-dev/ui-kit se instala desde el registry privado configurado en .npmrc;',
      'tiene que ser accesible desde tu red al correr npm install.',
    ],
  };
}

/**
 * Interactive reporter: full-screen terminal with an animated mascot header, prompts, a step list
 * and, once the screen is left, the final summary (so it stays visible after the CLI exits).
 * @param {{ screen?: ReturnType<typeof createScreen>, out?: { write: (text: string) => unknown }, sleep?: (ms: number) => Promise<void>, cwd?: string }} [deps]
 *   Injectable for tests.
 */
export function createInteractiveReporter({
  out = process.stdout,
  screen = process.env.TERM === 'dumb' ? createNoScreen() : createScreen(out),
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  cwd = process.cwd(),
} = {}) {
  const steps = [];
  const warnings = [];
  let frame = 0;

  const header = () => headerLines({ frame, title: TITLE, subtitle: SUBTITLE, stack: STACK, detail: cwd, version: VERSION });

  function drawSteps(tick) {
    screen.clear();
    out.write(`\n${header().join('\n')}\n\n`);
    const lines = steps.map(({ label, status }) => {
      if (status === 'done') return `  ${pc.green('✔')} ${label}`;
      if (status === 'warned') return `  ${pc.yellow('!')} ${label}`;
      if (status === 'failed') return `  ${pc.red('✖')} ${pc.red(`${label}: falló`)}`;
      return `  ${pc.cyan(SPINNER[tick % SPINNER.length])} ${label}`;
    });
    out.write(`${lines.join('\n')}\n`);
  }

  return {
    async intro() {
      screen.enter();
      screen.hideCursor();
      for (frame = 0; frame < SPLASH_FRAMES; frame++) {
        screen.clear();
        out.write(`\n${header().join('\n')}\n`);
        await sleep(FRAME_MS);
      }
      frame = 0;
      screen.clear();
      out.write(`\n${header().join('\n')}\n\n`);
      screen.showCursor();
    },
    async runStep(label, action) {
      const step = { label, status: 'running' };
      steps.push(step);
      let tick = 0;
      screen.hideCursor();
      drawSteps(tick);
      const timer = setInterval(() => {
        tick++;
        frame = (frame + 1) % FRAME_COUNT;
        drawSteps(tick);
      }, FRAME_MS);
      try {
        const warning = await action();
        step.status = warning ? 'warned' : 'done';
        if (warning) warnings.push(warning);
      } catch (error) {
        step.status = 'failed';
        throw error;
      } finally {
        clearInterval(timer);
        drawSteps(tick);
        screen.showCursor();
      }
    },
    /** Clears the screen and redraws the header with the answers so far (used when going back). */
    redraw(answerLines = []) {
      screen.clear();
      frame = 0;
      out.write(`\n${header().join('\n')}\n`);
      if (answerLines.length > 0) out.write(`\n  ${pc.dim(answerLines.join(' · '))}\n`);
      out.write('\n');
    },
    summary(project) {
      screen.leave();
      const { title, lines } = buildSummary(project);
      out.write(`\n${headerLines({ frame: 0, title: TITLE, subtitle: SUBTITLE, stack: STACK, detail: cwd, version: VERSION }).join('\n')}\n\n`);
      warnings.forEach((warning) => clack.log.warn(warning, { output: out }));
      clack.note(lines.join('\n'), title, { output: out });
      clack.outro(pc.green('¡A programar!'), { output: out });
    },
    cancelled() {
      screen.leave();
      clack.cancel('Cancelado. No se escribió nada.', { output: out });
    },
    error(message) {
      screen.leave();
      clack.log.error(message, { output: out });
      clack.outro(pc.red('La generación falló.'), { output: out });
    },
  };
}

/** Screen stand-in for terminals without cursor control: everything is a no-op, output stays inline. */
function createNoScreen() {
  const noop = () => {};
  return { enter: noop, leave: noop, clear: noop, hideCursor: noop, showCursor: noop, isActive: () => false };
}

/** Plain reporter for non-interactive runs: text lines only, no colors or animation. */
export function createPlainReporter(write = (line) => console.log(line)) {
  let step = 0;
  return {
    intro() {
      write(TITLE);
    },
    async runStep(label, action) {
      step++;
      try {
        const warning = await action();
        write(warning ? `[${step}] ${label}... AVISO: ${warning}` : `[${step}] ${label}... listo`);
      } catch (error) {
        write(`[${step}] ${label}... FALLÓ`);
        throw error;
      }
    },
    summary(project) {
      const { title, lines } = buildSummary(project);
      write(title);
      lines.forEach((line) => write(line));
    },
    cancelled() {
      write('Cancelado. No se escribió nada.');
    },
    error(message) {
      write(`Error: ${message}`);
    },
  };
}

/** Returned by the real prompts when the user presses Esc (go back). Ctrl+C returns clack's cancel. */
export const BACK = Symbol('prompts:back');

const HINT_BACK = 'Esc: volver · Ctrl+C: salir';
const HINT_FIRST = 'Ctrl+C: salir';

/**
 * Wraps text to `width` columns without splitting words. Existing line breaks are kept.
 * @param {string} text
 * @param {number} width
 * @returns {string}
 */
export function wrapText(text, width) {
  const limit = Math.max(20, width);
  return text
    .split('\n')
    .map((paragraph) => {
      const lines = [];
      let line = '';
      for (const word of paragraph.split(' ')) {
        if (line && line.length + 1 + word.length > limit) {
          lines.push(line);
          line = word;
        } else {
          line = line ? `${line} ${word}` : word;
        }
      }
      lines.push(line);
      return lines.join('\n');
    })
    .join('\n');
}

/**
 * Prompts built on @clack/prompts that tell Esc from Ctrl+C (clack reports both as a cancel):
 * Esc returns `BACK`, Ctrl+C returns clack's cancel. Messages are wrapped to the terminal width
 * and followed by a hint with the keys.
 * @param {{ stdin?: { on: Function, off: Function }, columns?: () => number }} [deps] - Injectable for tests.
 */
export function createPrompts({
  stdin = process.stdin,
  columns = () => process.stdout.columns || 80,
  clackApi = clack,
} = {}) {
  async function ask(method, { back = false, message, ...options }) {
    const hint = pc.dim(back ? HINT_BACK : HINT_FIRST);
    for (;;) {
      let lastKey;
      const onKeypress = (_text, key) => {
        lastKey = key?.name;
      };
      stdin.on('keypress', onKeypress);
      let answer;
      try {
        answer = await clackApi[method]({
          ...options,
          message: `${wrapText(message, columns() - 6)}\n${hint}`,
        });
      } finally {
        stdin.off('keypress', onKeypress);
      }
      if (!(clackApi.isCancel(answer) && lastKey === 'escape')) return answer;
      // Esc: go back, or ask the same question again when there is nothing to go back to.
      if (back) return BACK;
    }
  }

  return {
    select: (options) => ask('select', options),
    text: (options) => ask('text', options),
    confirm: (options) => ask('confirm', { active: 'Sí', inactive: 'No', ...options }),
    isCancel: (value) => clackApi.isCancel(value),
    isBack: (value) => value === BACK,
  };
}

/** Real prompts. */
export const clackPrompts = createPrompts();
