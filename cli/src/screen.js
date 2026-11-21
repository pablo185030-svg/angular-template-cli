const ENTER_ALT_SCREEN = '\u001b[?1049h';
const LEAVE_ALT_SCREEN = '\u001b[?1049l';
const HIDE_CURSOR = '\u001b[?25l';
const SHOW_CURSOR = '\u001b[?25h';
const CLEAR = '\u001b[H\u001b[2J';

/**
 * Controls the terminal screen: full-screen (alternate buffer) mode, cursor visibility and clearing.
 * Leaving is idempotent and also runs on process exit and on SIGINT/SIGTERM, so the terminal is
 * never left broken.
 * @param {{ write: (text: string) => unknown }} [out] - Output stream, injectable for tests.
 * @param {{ on?: Function, off?: Function, exit?: Function }} [proc] - Process-like object for hooks.
 */
export function createScreen(out = process.stdout, proc = process) {
  let active = false;

  const onExit = () => leave();
  const onSignal = (signal) => {
    leave();
    proc.exit?.(signal === 'SIGINT' ? 130 : 143);
  };
  const onSigint = () => onSignal('SIGINT');
  const onSigterm = () => onSignal('SIGTERM');

  function enter() {
    if (active) return;
    active = true;
    out.write(ENTER_ALT_SCREEN + CLEAR);
    proc.on?.('exit', onExit);
    proc.on?.('SIGINT', onSigint);
    proc.on?.('SIGTERM', onSigterm);
  }

  function leave() {
    if (!active) return;
    active = false;
    out.write(SHOW_CURSOR + LEAVE_ALT_SCREEN);
    proc.off?.('exit', onExit);
    proc.off?.('SIGINT', onSigint);
    proc.off?.('SIGTERM', onSigterm);
  }

  return {
    enter,
    leave,
    isActive: () => active,
    clear: () => out.write(CLEAR),
    hideCursor: () => out.write(HIDE_CURSOR),
    showCursor: () => out.write(SHOW_CURSOR),
  };
}
