import { match, ok, strictEqual } from 'node:assert';
import { test } from 'node:test';
import { FRAME_COUNT, headerLines, mascotLines } from '../src/mascot.js';
import { createScreen } from '../src/screen.js';
import { buildSummary, createInteractiveReporter } from '../src/ui.js';

const strip = (text) => text.replace(/\u001b\[[0-9;?]*[A-Za-z]/g, '');

function fakeProc() {
  const handlers = new Map();
  return {
    handlers,
    on: (event, handler) => handlers.set(event, handler),
    off: (event) => handlers.delete(event),
    exit: () => {},
  };
}

test('mascot frames differ (blink and legs) and keep the same height', () => {
  const frames = Array.from({ length: FRAME_COUNT }, (_, index) => mascotLines(index).join('\n'));

  ok(new Set(frames).size > 1, 'frames are all identical');
  ok(frames.every((frame) => frame.split('\n').length === 5));
  strictEqual(mascotLines(FRAME_COUNT).join('\n'), frames[0]);
});

test('the header puts the title next to the mascot', () => {
  const text = strip(headerLines({ title: 'Titulo', subtitle: 'Sub' }).join('\n'));

  match(text, /Titulo/);
  match(text, /Sub/);
});

test('the header shows the stack line when given', () => {
  const text = strip(headerLines({ title: 'T', subtitle: 'S', stack: 'Stack: Angular', detail: 'd' }).join('\n'));

  match(text, /Stack: Angular/);
});

test('the screen enters and leaves the alternate buffer once and restores the cursor', () => {
  const writes = [];
  const proc = fakeProc();
  const screen = createScreen({ write: (text) => writes.push(text) }, proc);

  screen.enter();
  screen.enter();
  ok(proc.handlers.has('exit') && proc.handlers.has('SIGINT'));
  screen.leave();
  screen.leave();

  strictEqual(writes.filter((text) => text.includes('\u001b[?1049h')).length, 1);
  strictEqual(writes.filter((text) => text.includes('\u001b[?1049l')).length, 1);
  ok(writes.at(-1).includes('\u001b[?25h'), 'cursor not shown again');
  strictEqual(proc.handlers.size, 0);
});

test('the screen is left when the process receives SIGINT', () => {
  const writes = [];
  const proc = fakeProc();
  const screen = createScreen({ write: (text) => writes.push(text) }, proc);
  screen.enter();

  proc.handlers.get('SIGINT')();

  strictEqual(screen.isActive(), false);
});

test('the reporter runs full screen and leaves it on failure', async () => {
  const writes = [];
  const out = { write: (text) => writes.push(text) };
  const screen = createScreen(out, fakeProc());
  const reporter = createInteractiveReporter({ out, screen, sleep: async () => {}, cwd: '/x' });

  await reporter.intro();
  strictEqual(screen.isActive(), true);
  await reporter.runStep('Paso uno', () => {});
  await rejects(() => reporter.runStep('Paso dos', () => { throw new Error('boom'); }));
  reporter.error('boom');

  strictEqual(screen.isActive(), false);
  const text = strip(writes.join(''));
  match(text, /✔ Paso uno/);
  match(text, /✖ Paso dos: falló/);
});

async function rejects(action) {
  let failed = false;
  try {
    await action();
  } catch {
    failed = true;
  }
  ok(failed, 'expected the action to fail');
}

test('the backoffice summary says the products ABM is only a sample', () => {
  const backoffice = buildSummary({ name: 'a-b', type: 'backoffice', targetDir: '/x/a-b' }).lines.join('\n');
  const publicApp = buildSummary({ name: 'a-b', type: 'public', targetDir: '/x/a-b' }).lines.join('\n');

  match(backoffice, /ABM de productos es solo de prueba/);
  ok(!/ABM/.test(publicApp));
});
