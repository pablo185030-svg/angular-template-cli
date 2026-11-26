import { DEFAULT_ROLE_PERMISSIONS, PERMISSIONS, Permission } from './models/permission.model';

/**
 * Works out the permissions of a Keycloak access token. A `permissions` claim wins when present
 * (add it with a Keycloak mapper); otherwise the realm roles named like the default roles
 * (`admin`, `escritura`, `lectura`) grant their permissions, and any other role grants nothing.
 * @param {Record<string, unknown> | null} payload - Decoded access token payload.
 * @returns {Permission[]} The user's permissions, in display order.
 */
export function permissionsFromKeycloakToken(
  payload: Record<string, unknown> | null,
): Permission[] {
  if (!payload) return [];

  const claim = payload['permissions'];
  const granted = new Set<string>();
  if (Array.isArray(claim)) {
    claim.forEach((permission) => granted.add(String(permission)));
  } else {
    const realmAccess = payload['realm_access'] as { roles?: unknown } | undefined;
    const roles = Array.isArray(realmAccess?.roles) ? realmAccess.roles : [];
    roles.forEach((role) =>
      (DEFAULT_ROLE_PERMISSIONS[String(role)] ?? []).forEach((p) => granted.add(p)),
    );
  }
  return PERMISSIONS.filter((permission) => granted.has(permission));
}

/**
 * Works out the role name to show for a Keycloak access token: a `role` claim when present,
 * otherwise the first realm role named like a default role (`admin`, `escritura`, `lectura`).
 * @param {Record<string, unknown> | null} payload - Decoded access token payload.
 * @returns {string} The role name, or an empty string when none is known.
 */
export function roleNameFromKeycloakToken(payload: Record<string, unknown> | null): string {
  if (!payload) return '';

  const claim = payload['role'];
  if (typeof claim === 'string') return claim;

  const realmAccess = payload['realm_access'] as { roles?: unknown } | undefined;
  const roles = Array.isArray(realmAccess?.roles) ? realmAccess.roles : [];
  return roles.map(String).find((role) => role in DEFAULT_ROLE_PERMISSIONS) ?? '';
}
