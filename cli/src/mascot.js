import pc from 'picocolors';

const ORANGE = (text) => `\u001b[38;2;167;139;250m${text}\u001b[39m`;

/** Pixel art is 14 wide. `#` is body, `.` is empty; eyes (`o`) are transparent when open. A cute octopus. */
const FEET = {
  a: ['.##.##..##.##.', '.##.##..##.##.'],
  b: ['.##.##..##.##.', '##..##..##..##'],
  c: ['.##.##..##.##.', '..##.##.##.##.'],
};

/** Builds the 10-pixel-tall grid of a frame. `legs` picks the feet pose; `eyes` is open or closed. */
function grid({ legs, eyes }) {
  const head = [
    '....######....',
    '..##########..',
    '.############.',
    '.############.',
    '.#oo######oo#.',
    '.#oo######oo#.',
    '.####.##.####.',
    '.############.',
  ].map((row) => row.replace(/o/g, eyes === 'open' ? '.' : '#'));
  return [...head, ...FEET[legs]];
}

/** Renders a pixel grid as terminal lines using half blocks (two pixel rows per text line). */
function render(rows) {
  const lines = [];
  for (let y = 0; y < rows.length; y += 2) {
    let line = '';
    for (let x = 0; x < rows[y].length; x++) {
      const top = rows[y][x] === '#';
      const bottom = rows[y + 1]?.[x] === '#';
      line += top && bottom ? '█' : top ? '▀' : bottom ? '▄' : ' ';
    }
    lines.push(ORANGE(line));
  }
  return lines;
}

/** Animation frames, in order. */
const FRAMES = [
  { legs: 'a', eyes: 'open' },
  { legs: 'b', eyes: 'open' },
  { legs: 'a', eyes: 'open' },
  { legs: 'c', eyes: 'open' },
  { legs: 'a', eyes: 'closed' },
  { legs: 'b', eyes: 'open' },
  { legs: 'a', eyes: 'open' },
  { legs: 'c', eyes: 'open' },
];

export const FRAME_COUNT = FRAMES.length;

/**
 * The mascot as text lines.
 * @param {number} [frame] - Animation frame; wraps around.
 * @returns {string[]}
 */
export function mascotLines(frame = 0) {
  return render(grid(FRAMES[((frame % FRAMES.length) + FRAMES.length) % FRAMES.length]));
}

/**
 * Header: the mascot on the left, title and subtitle on the right.
 * @param {{ frame?: number, title: string, subtitle: string, stack?: string, detail?: string }} options
 * @returns {string[]}
 */
export function headerLines({ frame = 0, title, subtitle, stack = '', detail = '' }) {
  const mascot = mascotLines(frame);
  const text = [badge(title), '', subtitle, '', styleStack(stack), pc.dim(detail)];
  const blank = ' '.repeat(14);
  const rows = Math.max(mascot.length, text.length);
  return Array.from({ length: rows }, (_, index) => `  ${mascot[index] ?? blank}   ${text[index] ?? ''}`);
}

/** Title as a highlighted badge: bold white text on the mascot's purple. */
function badge(text) {
  return `\u001b[48;2;109;40;217m\u001b[1;97m ${text} \u001b[0m`;
}

/** Stack line: a dim label followed by the items in light purple, separated by dim dots. */
function styleStack(stack) {
  if (!stack) return '';
  const [label, list] = stack.includes(': ') ? stack.split(/: (.*)/s) : ['', stack];
  const items = list.split(' · ').map((item) => ORANGE(item)).join(pc.dim(' · '));
  return label ? `${pc.dim(`${label}:`)} ${items}` : items;
}
