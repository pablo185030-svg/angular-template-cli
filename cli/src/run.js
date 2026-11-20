import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { generateProject } from './generate.js';
import { clackPrompts, createInteractiveReporter, createPlainReporter } from './ui.js';
import { CancelledError, UsageError, resolveOptions } from './wizard.js';

const DEFAULT_TEMPLATES_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'templates');

export const HELP = `Usage: npm run create -- [options]

Generates a new Angular project from a Coto template.

Options:
  --type <public|backoffice>  Kind of app to create
  --name <project-name>       Project name (lowercase, numbers and hyphens)
  --out <directory>           Parent directory for the new project (default: current directory)
  -y, --yes                   Do not prompt; plain text output (needs --type and --name)
  -h, --help                  Show this help
`;

/**
 * Runs the wizard.
 * @param {string[]} argv - Command-line arguments (without node and the script path).
 * @param {object} [deps] - Injectable dependencies, used by tests.
 * @returns {Promise<number>} The process exit code.
 */
export async function run(argv, deps = {}) {
  const {
    prompts = clackPrompts,
    templatesDir = DEFAULT_TEMPLATES_DIR,
    isTTY = Boolean(process.stdin.isTTY && process.stdout.isTTY),
    cwd = process.cwd(),
    reporterFactory,
    runGit,
    write = (line) => console.log(line),
  } = deps;

  let values;
  try {
    ({ values } = parseArgs({
      args: argv,
      options: {
        type: { type: 'string' },
        name: { type: 'string' },
        out: { type: 'string' },
        yes: { type: 'boolean', short: 'y' },
        help: { type: 'boolean', short: 'h' },
      },
    }));
  } catch (error) {
    write(`Error: ${error.message}\n\n${HELP}`);
    return 1;
  }

  if (values.help) {
    write(HELP);
    return 0;
  }

  const interactive = isTTY && !values.yes;
  const reporter =
    reporterFactory?.(interactive) ??
    (interactive ? createInteractiveReporter() : createPlainReporter(write));

  reporter.intro();

  try {
    const { type, name } = await resolveOptions({
      flags: { type: values.type, name: values.name },
      interactive,
      prompts,
    });
    const targetDir = resolve(cwd, values.out ?? '.', name);

    await generateProject({
      templateDir: join(templatesDir, type),
      targetDir,
      projectName: name,
      runStep: reporter.runStep,
      runGit,
    });
    reporter.summary({ name, type, targetDir });
    return 0;
  } catch (error) {
    if (error instanceof CancelledError) {
      reporter.cancelled();
      return 130;
    }
    reporter.error(error.message);
    return error instanceof UsageError ? 2 : 1;
  }
}
