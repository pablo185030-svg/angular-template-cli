/** What a signed-in user may do. A role is a set of permissions. */
export type Permission = 'read' | 'write' | 'manage-roles';

/** Every permission, in display order. */
export const PERMISSIONS: readonly Permission[] = ['read', 'write', 'manage-roles'];

/** Spanish labels shown in the UI. */
export const PERMISSION_LABELS: Record<Permission, string> = {
  read: 'Ver',
  write: 'Crear, editar y eliminar',
  'manage-roles': 'Administrar roles',
};

/** Permissions of the default roles, used to map Keycloak realm roles. */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: ['read', 'write', 'manage-roles'],
  escritura: ['read', 'write'],
  lectura: ['read'],
};
