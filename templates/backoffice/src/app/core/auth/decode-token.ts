import { TokenClaims } from './models/token-claims.model';

function toBase64Url(text: string): string {
  const binary = String.fromCharCode(...new TextEncoder().encode(text));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Reads the payload of a JWT-shaped token without verifying it.
 * @param {string} token - Token in `header.payload.signature` form.
 * @returns {Record<string, unknown> | null} The payload, or null when the token is malformed.
 */
export function decodePayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const binary = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const value = JSON.parse(
      new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0))),
    );
    return value !== null && typeof value === 'object' ? value : null;
  } catch {
    return null;
  }
}

/**
 * Reads the claims of a demo token without verifying it (demo tokens are unsigned).
 * @param {string} token - Token in `header.payload.signature` form.
 * @returns {TokenClaims | null} The claims, or null when the token is malformed.
 */
export function decodeToken(token: string): TokenClaims | null {
  const claims = decodePayload(token);
  const valid =
    claims !== null &&
    typeof claims['name'] === 'string' &&
    typeof claims['sub'] === 'string' &&
    typeof claims['exp'] === 'number' &&
    typeof claims['role'] === 'string' &&
    Array.isArray(claims['permissions']);
  return valid ? (claims as unknown as TokenClaims) : null;
}

/**
 * Builds an unsigned JWT-shaped token (`header.payload.`) for the demo mode.
 * @param {TokenClaims} claims - Claims to carry.
 */
export function encodeToken(claims: TokenClaims): string {
  return `${toBase64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }))}.${toBase64Url(JSON.stringify(claims))}.`;
}
