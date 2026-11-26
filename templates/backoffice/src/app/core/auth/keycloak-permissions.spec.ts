import { permissionsFromKeycloakToken, roleNameFromKeycloakToken } from './keycloak-permissions';

describe('permissionsFromKeycloakToken', () => {
  it('uses the permissions claim when present', () => {
    expect(
      permissionsFromKeycloakToken({
        permissions: ['write', 'read', 'bogus'],
        realm_access: { roles: ['admin'] },
      }),
    ).toEqual(['read', 'write']);
  });

  it('maps the default realm roles to their permissions', () => {
    expect(
      permissionsFromKeycloakToken({ realm_access: { roles: ['escritura', 'offline_access'] } }),
    ).toEqual(['read', 'write']);
    expect(permissionsFromKeycloakToken({ realm_access: { roles: ['admin'] } })).toEqual([
      'read',
      'write',
      'manage-roles',
    ]);
  });

  it('grants nothing for unknown roles or a missing payload', () => {
    expect(permissionsFromKeycloakToken({ realm_access: { roles: ['other'] } })).toEqual([]);
    expect(permissionsFromKeycloakToken({})).toEqual([]);
    expect(permissionsFromKeycloakToken(null)).toEqual([]);
  });
});

describe('roleNameFromKeycloakToken', () => {
  it('prefers the role claim, then a default realm role, else empty', () => {
    expect(roleNameFromKeycloakToken({ role: 'ventas' })).toBe('ventas');
    expect(
      roleNameFromKeycloakToken({ realm_access: { roles: ['offline_access', 'escritura'] } }),
    ).toBe('escritura');
    expect(roleNameFromKeycloakToken({ realm_access: { roles: ['other'] } })).toBe('');
    expect(roleNameFromKeycloakToken(null)).toBe('');
  });
});
