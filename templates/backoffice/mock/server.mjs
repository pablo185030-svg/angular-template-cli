// Minimal in-memory mock of the products API, so the CRUD example runs without a backend.
// Run with `npm run mock:api` (port 5000, override with PORT). Data resets on restart.
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';

const PORT = Number(process.env.PORT) || 5000;

// The seed is shared with the app's JSON data source (see `public/mock/products.json`).
const products = JSON.parse(
  readFileSync(new URL('../public/mock/products.json', import.meta.url), 'utf8'),
);
let nextId = Math.max(0, ...products.map((product) => product.id)) + 1;

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(body === undefined ? undefined : JSON.stringify(body));
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

const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');

  if (pathname === '/health') return send(res, 200, { status: 'ok' });

  const match = pathname.match(/^\/api\/products(?:\/(\d+))?$/);
  if (!match) return send(res, 404, { message: 'No encontrado' });

  const id = match[1] === undefined ? undefined : Number(match[1]);
  const index = id === undefined ? -1 : products.findIndex((product) => product.id === id);

  try {
    if (req.method === 'GET' && id === undefined) return send(res, 200, products);
    if (req.method === 'GET') {
      return index < 0 ? send(res, 404, { message: 'No encontrado' }) : send(res, 200, products[index]);
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
