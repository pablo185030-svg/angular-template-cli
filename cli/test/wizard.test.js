import { deepStrictEqual, rejects, strictEqual } from 'node:assert';
import { test } from 'node:test';
import { CancelledError, UsageError, resolveOptions } from '../src/wizard.js';
import { CANCEL, fakePrompts } from '../support/test-helpers.js';

test('prompts for both values when no flags are given', async () => {
  const prompts = fakePrompts(['backoffice', 'my-shop']);

  const result = await resolveOptions({ flags: {}, interactive: true, prompts });

  deepStrictEqual(result, { type: 'backoffice', name: 'my-shop' });
  strictEqual(prompts.asked.length, 2);
});

test('does not prompt for values given as flags', async () => {
  const prompts = fakePrompts(['my-shop']);

  const result = await resolveOptions({ flags: { type: 'public' }, interactive: true, prompts });

  deepStrictEqual(result, { type: 'public', name: 'my-shop' });
  strictEqual(prompts.asked.length, 1);
});

test('the name prompt validates inline so the user can correct it', async () => {
  const prompts = fakePrompts(['public', 'ok-name']);
  await resolveOptions({ flags: {}, interactive: true, prompts });

  const { validate } = prompts.asked[1];

  strictEqual(typeof validate('Bad Name'), 'string');
  strictEqual(validate('good-name'), undefined);
});

test('cancelling any prompt throws CancelledError', async () => {
  await rejects(
    resolveOptions({ flags: {}, interactive: true, prompts: fakePrompts([CANCEL]) }),
    CancelledError,
  );
  await rejects(
    resolveOptions({ flags: {}, interactive: true, prompts: fakePrompts(['public', CANCEL]) }),
    CancelledError,
  );
});

test('without a terminal, both flags are required', async () => {
  await rejects(resolveOptions({ flags: { type: 'public' }, interactive: false, prompts: fakePrompts([]) }), UsageError);
  const result = await resolveOptions({ flags: { type: 'public', name: 'a-b' }, interactive: false, prompts: fakePrompts([]) });
  deepStrictEqual(result, { type: 'public', name: 'a-b' });
});

test('rejects an invalid flag value even when interactive', async () => {
  await rejects(resolveOptions({ flags: { name: 'Bad Name' }, interactive: true, prompts: fakePrompts([]) }), UsageError);
  await rejects(resolveOptions({ flags: { type: 'mobile' }, interactive: true, prompts: fakePrompts([]) }), UsageError);
});
