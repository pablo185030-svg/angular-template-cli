import { deepStrictEqual, match, ok, rejects, strictEqual } from 'node:assert';
import { EventEmitter } from 'node:events';
import { test } from 'node:test';
import { BACK as REAL_BACK, createPrompts, wrapText } from '../src/ui.js';
import { CancelledError, resolveOptions } from '../src/wizard.js';
import { BACK, CANCEL, fakePrompts } from '../support/test-helpers.js';

const LOC = '/work';
const resolve = (answers, flags = {}) => {
  const prompts = fakePrompts(answers);
  return resolveOptions({ flags, interactive: true, prompts, defaultOutDir: LOC }).then((result) => ({ result, prompts }));
};

test('Esc returns to the previous question, offering the previous answer, and the new answer is used', async () => {
  // public: type, name, location, (back to location), dark, rendering, remote, commit, install
  const { result, prompts } = await resolve([
    'public', 'my-site', '/a', BACK, '/b', false, 'ssr', false, true, false,
  ]);

  strictEqual(result.outDir, '/b');
  const locationAsks = prompts.asked.filter((question) => /Dónde querés crear/.test(question.message));
  strictEqual(locationAsks.length, 2);
  strictEqual(locationAsks[1].initialValue, '/a', 'the previous answer is the initial value');
});

test('going back skips the questions that do not apply to the app type', async () => {
  // public: Esc on the remote question goes back to rendering, not to Keycloak or the mock API
  const { prompts } = await resolve(['public', 'a-b', LOC, false, 'ssr', BACK, 'ssg', false, true, false]);

  const messages = prompts.asked.map((question) => question.message);
  ok(!messages.some((message) => /Keycloak|API mock/.test(message)));
  ok(messages.filter((message) => /renderizar/.test(message)).length === 2);
});

test('going back over a question answered by a flag stays on the first asked question', async () => {
  const { result, prompts } = await resolve(
    [BACK, 'my-site', LOC, false, 'ssr', false, true, false],
    { type: 'public' },
  );

  strictEqual(result.name, 'my-site');
  strictEqual(prompts.asked.filter((question) => question.message === 'Nombre del proyecto').length, 2);
  strictEqual(prompts.asked[0].back, false, 'nothing to go back to');
});

test('the first asked question is not offered a way back, later ones are', async () => {
  const { prompts } = await resolve(['public', 'a-b', LOC, false, 'ssr', false, true, false]);

  strictEqual(prompts.asked[0].back, false);
  ok(prompts.asked.slice(1).every((question) => question.back === true));
});

test('changing the app type on the way back drops the answers that no longer apply', async () => {
  // backoffice: type, name, location, keycloak no, mock yes, then back x4 to type; pick public
  const { result } = await resolve([
    'backoffice', 'a-b', LOC, false, true, BACK, BACK, BACK, BACK, BACK,
    'public', 'a-b', LOC, false, 'spa', false, true, false,
  ]);

  strictEqual(result.type, 'public');
  strictEqual(result.rendering, 'spa');
  ok(!('mockApi' in result) && !('keycloak' in result));
});

test('Esc inside Keycloak goes back one sub-question and the sub-answers are kept', async () => {
  const { result, prompts } = await resolve([
    'backoffice', 'my-admin', LOC,
    true, 'https://sso.example.com', BACK, 'https://sso2.example.com', 'my-realm', 'my-admin',
    true, false, false, true, false,
  ]);

  deepStrictEqual(result.keycloak, { url: 'https://sso2.example.com', realm: 'my-realm', clientId: 'my-admin' });
  const urlAsks = prompts.asked.filter((question) => /URL de Keycloak/.test(question.message));
  strictEqual(urlAsks[1].initialValue, 'https://sso.example.com');
});

test('Esc on the first Keycloak sub-question goes back to the previous step', async () => {
  const { result, prompts } = await resolve([
    'backoffice', 'a-b', LOC, BACK, '/other', false, true, false, false, true, false,
  ]);

  strictEqual(result.outDir, '/other');
  strictEqual(prompts.asked.filter((question) => /configurar Keycloak/.test(question.message)).length, 2);
});

test('Ctrl+C still cancels, also after going back', async () => {
  await rejects(resolve(['public', 'a-b', LOC, BACK, CANCEL]), CancelledError);
});

test('going back asks the reporter to redraw with the answers so far', async () => {
  const redraws = [];
  const prompts = fakePrompts(['public', 'my-site', '/a', BACK, '/b', false, 'ssr', false, true, false]);

  await resolveOptions({ flags: {}, interactive: true, prompts, defaultOutDir: LOC, redraw: (lines) => redraws.push(lines) });

  strictEqual(redraws.length, 1);
  deepStrictEqual(redraws[0], ['Tipo: Sitio web expuesto a internet', 'Nombre: my-site', 'Carpeta: /a']);
});

test('without a terminal nothing is asked and the result is unchanged', async () => {
  const prompts = fakePrompts([]);

  const result = await resolveOptions({ flags: { type: 'public', name: 'a-b' }, interactive: false, prompts });

  deepStrictEqual(result, { type: 'public', name: 'a-b', darkMode: false, rendering: 'ssr', commit: false, install: false });
  strictEqual(prompts.asked.length, 0);
});

// --- real prompts wrapper -------------------------------------------------------------------

const CLACK_CANCEL = Symbol('clack-cancel');

/** A clack double that, when asked, emits `key` on stdin and resolves with `answer`. */
function fakeClack(stdin, script) {
  const calls = [];
  const api = {
    isCancel: (value) => value === CLACK_CANCEL,
  };
  for (const method of ['select', 'text', 'confirm']) {
    api[method] = async (options) => {
      calls.push(options);
      const { key, answer } = script.shift();
      stdin.emit('keypress', undefined, { name: key });
      return answer;
    };
  }
  return { api, calls };
}

test('Esc returns BACK and Ctrl+C returns the cancel symbol', async () => {
  const stdin = new EventEmitter();
  const { api } = fakeClack(stdin, [
    { key: 'escape', answer: CLACK_CANCEL },
    { key: 'c', answer: CLACK_CANCEL },
    { key: 'return', answer: 'ok' },
  ]);
  const prompts = createPrompts({ stdin, columns: () => 80, clackApi: api });

  strictEqual(await prompts.text({ message: 'a', back: true }), REAL_BACK);
  ok(prompts.isBack(REAL_BACK));
  strictEqual(await prompts.text({ message: 'b', back: true }), CLACK_CANCEL);
  strictEqual(await prompts.text({ message: 'c', back: true }), 'ok');
  strictEqual(stdin.listenerCount('keypress'), 0, 'the key listener is removed after each prompt');
});

test('wrapText wraps at the width without splitting words and keeps line breaks', () => {
  strictEqual(wrapText('uno dos tres cuatro', 8).split('\n').every((line) => line.length <= 20), true);
  strictEqual(wrapText('aaaa bbbb cccc dddd eeee ffff gggg hhhh', 20), 'aaaa bbbb cccc dddd\neeee ffff gggg hhhh');
  strictEqual(wrapText('a\nb', 80), 'a\nb');
});

test('questions are wrapped to the terminal width and show the keys hint', async () => {
  const stdin = new EventEmitter();
  const { api, calls } = fakeClack(stdin, [
    { key: 'return', answer: true },
    { key: 'return', answer: true },
  ]);
  const prompts = createPrompts({ stdin, columns: () => 46, clackApi: api });
  const long = 'palabra '.repeat(20).trim();

  await prompts.confirm({ message: long, back: true });
  await prompts.confirm({ message: long, back: false });

  const [withBack, first] = calls.map((call) => call.message.replace(/\u001b\[[0-9;]*m/g, '').split('\n'));
  ok(withBack.length > 3, 'the long message spans several lines');
  ok(withBack.slice(0, -1).every((line) => line.length <= 40));
  strictEqual(withBack.at(-1), 'Esc: volver · Ctrl+C: salir');
  strictEqual(first.at(-1), 'Ctrl+C: salir');
  match(withBack.join(' '), /palabra palabra/);
});

test('Esc on a question with nothing before it asks the same question again', async () => {
  const stdin = new EventEmitter();
  const { api, calls } = fakeClack(stdin, [
    { key: 'escape', answer: CLACK_CANCEL },
    { key: 'return', answer: 'valor' },
  ]);
  const prompts = createPrompts({ stdin, columns: () => 80, clackApi: api });

  strictEqual(await prompts.text({ message: 'q', back: false }), 'valor');
  strictEqual(calls.length, 2);
});

test('yes/no questions are shown in Spanish', async () => {
  const stdin = new EventEmitter();
  const { api, calls } = fakeClack(stdin, [{ key: 'return', answer: true }]);
  const prompts = createPrompts({ stdin, columns: () => 80, clackApi: api });

  await prompts.confirm({ message: 'q', back: false });

  strictEqual(calls[0].active, 'Sí');
  strictEqual(calls[0].inactive, 'No');
});
