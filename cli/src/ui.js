import * as clack from '@clack/prompts';
import pc from 'picocolors';

const BANNER = [
  '   ____ ___ _____ ___  ',
  '  / ___/ _ \\_   _/ _ \\ ',
  ' | |  | | | || || | | |',
  ' | |__| |_| || || |_| |',
  '  \\____\\___/ |_| \\___/ ',
];

/**
 * Builds the summary shown when a project is ready.
 * @param {{ name: string, type: string, targetDir: string }} project
 * @returns {{ title: string, lines: string[] }}
 */
export function buildSummary({ name, type, targetDir, cdPath = name, keycloakConfigured = false }) {
  const commands = [`cd ${cdPath}`, 'npm install'];
  if (type === 'backoffice') commands.push('npm run mock:api   # en una segunda terminal');
  commands.push('npm start');

  const keycloakLines =
    type !== 'backoffice'
      ? []
      : keycloakConfigured
        ? [
            'Keycloak configurado. Agregá http://localhost:4200/* como redirect URI del client.',
            '',
          ]
        : [
            'Keycloak sin configurar: el backoffice arranca en modo demo (usuario ficticio).',
            'Para conectarlo después: npm run configure:keycloak',
            '',
          ];

  return {
    title: `Proyecto "${name}" creado en ${targetDir}`,
    lines: [
      'Próximos pasos:',
      ...commands.map((command) => `  ${command}`),
      '',
      ...keycloakLines,
      '@coto-dev/ui-kit se instala desde el registry privado configurado en .npmrc;',
      'tiene que ser accesible desde tu red al correr npm install.',
    ],
  };
}

/** Interactive reporter: banner, spinners and a framed summary. */
export function createInteractiveReporter() {
  return {
    intro() {
      console.log(pc.cyan(BANNER.join('\n')));
      clack.intro(pc.bgCyan(pc.black(' Asistente Angular de Coto ')));
    },
    async runStep(label, action) {
      const spinner = clack.spinner();
      spinner.start(label);
      try {
        await action();
        spinner.stop(pc.green(label));
      } catch (error) {
        spinner.stop(pc.red(`${label}: falló`), 1);
        throw error;
      }
    },
    summary(project) {
      const { title, lines } = buildSummary(project);
      clack.note(lines.join('\n'), title);
      clack.outro(pc.green('¡A programar!'));
    },
    cancelled() {
      clack.cancel('Cancelado. No se escribió nada.');
    },
    error(message) {
      clack.log.error(message);
      clack.outro(pc.red('La generación falló.'));
    },
  };
}

/** Plain reporter for non-interactive runs: text lines only, no colors or animation. */
export function createPlainReporter(write = (line) => console.log(line)) {
  let step = 0;
  return {
    intro() {
      write('Asistente Angular de Coto');
    },
    async runStep(label, action) {
      step++;
      try {
        await action();
        write(`[${step}] ${label}... listo`);
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

/** Real prompts, wrapping @clack/prompts. */
export const clackPrompts = {
  select: (options) => clack.select(options),
  text: (options) => clack.text(options),
  confirm: (options) => clack.confirm(options),
  isCancel: (value) => clack.isCancel(value),
};
