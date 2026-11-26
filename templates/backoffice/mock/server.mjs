// Minimal in-memory mock of the products, roles and login API, so the example runs without a
// backend. Run with `npm run mock:api` (port 5000, override with PORT). Data resets on restart.
// `POST /api/auth/login` checks a seeded user and issues a fake, unsigned token (demo mode uses
// it). `/api/products` and `/api/roles` answer 401 without an `Authorization: Bearer` header and
// 403 when the token lacks the needed permission. The token is trusted, never verified.
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';

const PORT = Number(process.env.PORT) || 5000;
const PERMISSIONS = ['read', 'write', 'manage-roles'];
const ADMIN_ROLE = 'admin';

// The seeds are shared with the app's JSON data source (see `public/mock/`).
const readSeed = (name) =>
  JSON.parse(readFileSync(new URL(`../public/mock/${name}.json`, import.meta.url), 'utf8'));
const products = readSeed('products');
const roles = readSeed('roles');
const users = readSeed('users');
let nextId = Math.max(0, ...products.map((product) => product.id)) + 1;
let nextRoleId = Math.max(0, ...roles.map((role) => role.id)) + 1;

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(body === undefined ? undefined : JSON.stringify(body));
}

const TOKEN_TTL_SECONDS = 8 * 60 * 60;

function base64Url(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

/** Builds an unsigned JWT-shaped token (`header.payload.`) for a user. */
function createToken(user, role) {
  const header = { alg: 'none', typ: 'JWT' };
  const payload = {
    sub: String(user.id),
    name: `${user.firstName} ${user.lastName}`,
    role: role.name,
    permissions: role.permissions,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };
  return `${base64Url(header)}.${base64Url(payload)}.`;
}

/** Reads the claims of the Bearer token (without verifying it), or null when there is none. */
function readClaims(req) {
  const match = /^Bearer\s+(\S+)/.exec(req.headers.authorization ?? '');
  if (!match) return null;
  try {
    const payload = match[1].split('.')[1] ?? '';
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) ?? {};
  } catch {
    return {};
  }
}

/** Answers 401/403 when the request lacks the permission. Returns true when it answered. */
function denied(req, res, permission) {
  const claims = readClaims(req);
  if (!claims) {
    send(res, 401, { message: 'No autorizado' });
    return true;
  }
  if (!Array.isArray(claims.permissions) || !claims.permissions.includes(permission)) {
    send(res, 403, { message: 'Sin permiso' });
    return true;
  }
  return false;
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

function validateRole(input) {
  const valid =
    typeof input.name === 'string' &&
    input.name.trim() !== '' &&
    typeof input.description === 'string' &&
    Array.isArray(input.permissions) &&
    input.permissions.every((permission) => PERMISSIONS.includes(permission)) &&
    input.permissions.includes('read');
  return valid
    ? {
        name: input.name.trim(),
        description: input.description.trim(),
        permissions: PERMISSIONS.filter((permission) => input.permissions.includes(permission)),
      }
    : null;
}

const withUserCount = (role) => ({
  ...role,
  userCount: users.filter((user) => user.roleId === role.id).length,
});

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
  const role = user && roles.find((candidate) => candidate.id === user.roleId);
  if (!user || !role) return send(res, 401, { message: 'Credenciales inválidas' });
  return send(res, 200, {
    access_token: createToken(user, role),
    token_type: 'Bearer',
    expires_in: TOKEN_TTL_SECONDS,
  });
}

async function handleRoles(req, res, roleId) {
  const index = roleId === undefined ? -1 : roles.findIndex((role) => role.id === roleId);
  const nameTaken = (name) => roles.some((role) => role.name === name && role.id !== roleId);

  try {
    if (req.method === 'GET' && roleId === undefined)
      return send(res, 200, roles.map(withUserCount));
    if (req.method === 'GET') {
      return index < 0
        ? send(res, 404, { message: 'No encontrado' })
        : send(res, 200, withUserCount(roles[index]));
    }
    if (req.method === 'POST' && roleId === undefined) {
      const input = validateRole(await readBody(req));
      if (!input) return send(res, 400, { message: 'Rol inválido' });
      if (nameTaken(input.name))
        return send(res, 409, { message: 'Ya existe un rol con ese nombre' });
      const created = { id: nextRoleId++, ...input };
      roles.push(created);
      return send(res, 201, withUserCount(created));
    }
    if (req.method === 'PUT' && roleId !== undefined) {
      if (index < 0) return send(res, 404, { message: 'No encontrado' });
      if (roles[index].name === ADMIN_ROLE) {
        return send(res, 409, { message: 'El rol admin no se puede modificar' });
      }
      const input = validateRole(await readBody(req));
      if (!input) return send(res, 400, { message: 'Rol inválido' });
      if (nameTaken(input.name))
        return send(res, 409, { message: 'Ya existe un rol con ese nombre' });
      roles[index] = { id: roleId, ...input };
      return send(res, 200, withUserCount(roles[index]));
    }
    if (req.method === 'DELETE' && roleId !== undefined) {
      if (index < 0) return send(res, 404, { message: 'No encontrado' });
      if (roles[index].name === ADMIN_ROLE) {
        return send(res, 409, { message: 'El rol admin no se puede eliminar' });
      }
      if (withUserCount(roles[index]).userCount > 0) {
        return send(res, 409, { message: 'El rol tiene usuarios asignados' });
      }
      roles.splice(index, 1);
      return send(res, 204);
    }
    return send(res, 405, { message: 'Método no permitido' });
  } catch {
    return send(res, 400, { message: 'JSON inválido' });
  }
}

const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');

  if (pathname === '/health') return send(res, 200, { status: 'ok' });

  if (pathname === '/api/auth/login') return handleLogin(req, res);

  const roleMatch = pathname.match(/^\/api\/roles(?:\/(\d+))?$/);
  if (roleMatch) {
    if (denied(req, res, 'manage-roles')) return;
    return handleRoles(req, res, roleMatch[1] === undefined ? undefined : Number(roleMatch[1]));
  }

  const match = pathname.match(/^\/api\/products(?:\/(\d+))?$/);
  if (!match) return send(res, 404, { message: 'No encontrado' });

  if (denied(req, res, req.method === 'GET' ? 'read' : 'write')) return;

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
