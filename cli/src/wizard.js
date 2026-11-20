import { APP_TYPES } from './constants.js';
import { validateAppType, validateProjectName } from './validate.js';

/** Thrown when the user cancels a prompt. */
export class CancelledError extends Error {}

/** Thrown when options are missing or invalid and no prompt can fix it. */
export class UsageError extends Error {}

/**
 * Resolves the app type and project name, prompting only for what the flags did not provide.
 * @param {object} options
 * @param {{ type?: string, name?: string }} options.flags - Values given on the command line.
 * @param {boolean} options.interactive - Whether prompts may be shown.
 * @param {{ select: Function, text: Function, isCancel: (value: unknown) => boolean }} options.prompts
 * @returns {Promise<{ type: string, name: string }>}
 */
export async function resolveOptions({ flags, interactive, prompts }) {
  let { type, name } = flags;

  if (type !== undefined) {
    const error = validateAppType(type);
    if (error) throw new UsageError(error);
  }
  if (name !== undefined) {
    const error = validateProjectName(name);
    if (error) throw new UsageError(error);
  }

  if (!interactive) {
    if (type === undefined || name === undefined) {
      throw new UsageError('Missing --type and/or --name. Both are required without a terminal.');
    }
    return { type, name };
  }

  if (type === undefined) {
    const answer = await prompts.select({
      message: 'What kind of app do you want to create?',
      options: APP_TYPES.map(({ value, label, hint }) => ({ value, label, hint })),
    });
    if (prompts.isCancel(answer)) throw new CancelledError();
    type = answer;
  }

  if (name === undefined) {
    const answer = await prompts.text({
      message: 'Project name',
      placeholder: 'my-app',
      validate: (value) => validateProjectName(value),
    });
    if (prompts.isCancel(answer)) throw new CancelledError();
    name = answer;
  }

  return { type, name };
}
