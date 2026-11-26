import { TokenClaims } from './models/token-claims.model';

/**
 * Reads the claims of a JWT-shaped token without verifying it (demo tokens are unsigned).
 * @param {string} token - Token in `header.payload.signature` form.
 * @returns {TokenClaims | null} The claims, or null when the token is malformed.
 */
export function decodeToken(token: string): TokenClaims | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const binary = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const claims = JSON.parse(
      new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0))),
    );
    const valid =
      typeof claims?.name === 'string' &&
      typeof claims.sub === 'string' &&
      typeof claims.exp === 'number' &&
      Array.isArray(claims.roles);
    return valid ? (claims as TokenClaims) : null;
  } catch {
    return null;
  }
}
