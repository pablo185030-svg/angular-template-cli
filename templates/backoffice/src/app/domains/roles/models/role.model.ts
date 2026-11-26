import { Permission } from '@core/auth/models/permission.model';

/** A role as returned by the API. */
export interface Role {
  id: number;
  name: string;
  description: string;
  permissions: Permission[];
  /** Users assigned to the role; a role with users cannot be deleted. */
  userCount?: number;
}

/** The editable fields of a role. */
export type RoleInput = Omit<Role, 'id' | 'userCount'>;

/** Name of the protected role: it cannot be deleted or edited. */
export const ADMIN_ROLE_NAME = 'admin';
