// Minimal in-memory mock of the products and login API, so the example runs without a backend.
// Run with `npm run mock:api` (port 5000, override with PORT). Data resets on restart.
// `POST /api/auth/login` checks a seeded user and issues a fake, unsigned token (demo mode uses
// it). `/api/products` answers 401 without an `Authorization: Bearer` header. The token is
// trusted, never verified, and no roles or permissions are checked.
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';

const PORT = Number(process.env.PORT) || 5000;

// The seeds are shared with the app's JSON data source (see `public/mock/`).
const readSeed = (name) =>
  JSON.parse(readFileSync(new URL(`../public/mock/${name}.json`, import.meta.url), 'utf8'));
const products = readSeed('products');
const users = readSeed('users');
let nextId = Math.max(0, ...products.map((product) => product.id)) + 1;

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(body === undefined ? undefined : JSON.stringify(body));
}

const TOKEN_TTL_SECONDS = 8 * 60 * 60;

function base64Url(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

/** Builds an unsigned JWT-shaped token (`header.payload.`) for a user. */
function createToken(user) {
  const header = { alg: 'none', typ: 'JWT' };
  const payload = {
    sub: String(user.id),
    name: `${user.firstName} ${user.lastName}`,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };
  return `${base64Url(header)}.${base64Url(payload)}.`;
}

/** Answers 401 when the request carries no Bearer token. Returns true when it answered. */
function unauthorized(req, res) {
  if (/^Bearer\s+\S+/.test(req.headers.authorization ?? '')) return false;
  send(res, 401, { message: 'No autorizado' });
  return true;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function validate(input) {
  const valid =
    typeof input.name === 'string' &&
    input.name.trim() !== '' &&
    Number.isFinite(input.price) &&
    input.price >= 0 &&
    Number.isInteger(input.stock) &&
    input.stock >= 0;
  return valid ? { name: input.name.trim(), price: input.price, stock: input.stock } : null;
}

async function handleLogin(req, res) {
  if (req.method !== 'POST') return send(res, 405, { message: 'Método no permitido' });
  let credentials;
  try {
    credentials = await readBody(req);
  } catch {
    return send(res, 400, { message: 'JSON inválido' });
  }
  const user = users.find(
    (candidate) =>
      candidate.username === credentials.username && candidate.password === credentials.password,
  );
  if (!user) return send(res, 401, { message: 'Credenciales inválidas' });
  return send(res, 200, {
    access_token: createToken(user),
    token_type: 'Bearer',
    expires_in: TOKEN_TTL_SECONDS,
  });
}

const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');

  if (pathname === '/health') return send(res, 200, { status: 'ok' });

  if (pathname === '/api/auth/login') return handleLogin(req, res);

  const match = pathname.match(/^\/api\/products(?:\/(\d+))?$/);
  if (!match) return send(res, 404, { message: 'No encontrado' });

  if (unauthorized(req, res)) return;

  const id = match[1] === undefined ? undefined : Number(match[1]);
  const index = id === undefined ? -1 : products.findIndex((product) => product.id === id);

  try {
    if (req.method === 'GET' && id === undefined) return send(res, 200, products);
    if (req.method === 'GET') {
      return index < 0
        ? send(res, 404, { message: 'No encontrado' })
        : send(res, 200, products[index]);
    }
    if (req.method === 'POST' && id === undefined) {
      const input = validate(await readBody(req));
      if (!input) return send(res, 400, { message: 'Producto inválido' });
      const created = { id: nextId++, ...input };
      products.push(created);
      return send(res, 201, created);
    }
    if (req.method === 'PUT' && id !== undefined) {
      if (index < 0) return send(res, 404, { message: 'No encontrado' });
      const input = validate(await readBody(req));
      if (!input) return send(res, 400, { message: 'Producto inválido' });
      products[index] = { id, ...input };
      return send(res, 200, products[index]);
    }
    if (req.method === 'DELETE' && id !== undefined) {
      if (index < 0) return send(res, 404, { message: 'No encontrado' });
      products.splice(index, 1);
      return send(res, 204);
    }
    return send(res, 405, { message: 'Método no permitido' });
  } catch {
    return send(res, 400, { message: 'JSON inválido' });
  }
});

server.listen(PORT, () => console.log(`Mock API listening on http://localhost:${PORT}`));
