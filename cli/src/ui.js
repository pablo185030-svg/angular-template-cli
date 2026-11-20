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
export function buildSummary({ name, type, targetDir }) {
  const commands = [`cd ${name}`, 'npm install'];
  if (type === 'backoffice') commands.push('npm run mock:api   # in a second terminal');
  commands.push('npm start');

  return {
    title: `Project "${name}" created in ${targetDir}`,
    lines: [
      'Next steps:',
      ...commands.map((command) => `  ${command}`),
      '',
      '@coto-dev/ui-kit is installed from the private registry configured in .npmrc;',
      'it must be reachable from your network when you run npm install.',
    ],
  };
}

/** Interactive reporter: banner, spinners and a framed summary. */
export function createInteractiveReporter() {
  return {
    intro() {
      console.log(pc.cyan(BANNER.join('\n')));
      clack.intro(pc.bgCyan(pc.black(' Coto Angular wizard ')));
    },
    async runStep(label, action) {
      const spinner = clack.spinner();
      spinner.start(label);
      try {
        await action();
        spinner.stop(pc.green(label));
      } catch (error) {
        spinner.stop(pc.red(`${label} failed`), 1);
        throw error;
      }
    },
    summary(project) {
      const { title, lines } = buildSummary(project);
      clack.note(lines.join('\n'), title);
      clack.outro(pc.green('Happy coding!'));
    },
    cancelled() {
      clack.cancel('Cancelled. Nothing was written.');
    },
    error(message) {
      clack.log.error(message);
      clack.outro(pc.red('Generation failed.'));
    },
  };
}

/** Plain reporter for non-interactive runs: text lines only, no colors or animation. */
export function createPlainReporter(write = (line) => console.log(line)) {
  let step = 0;
  return {
    intro() {
      write('Coto Angular wizard');
    },
    async runStep(label, action) {
      step++;
      try {
        await action();
        write(`[${step}] ${label}... done`);
      } catch (error) {
        write(`[${step}] ${label}... FAILED`);
        throw error;
      }
    },
    summary(project) {
      const { title, lines } = buildSummary(project);
      write(title);
      lines.forEach((line) => write(line));
    },
    cancelled() {
      write('Cancelled. Nothing was written.');
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
  isCancel: (value) => clack.isCancel(value),
};
