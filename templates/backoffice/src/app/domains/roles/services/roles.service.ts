import { Observable } from 'rxjs';
import { Role, RoleInput } from '../models/role.model';

/**
 * Roles CRUD contract used by the pages. The app provides `HttpRolesService` or
 * `JsonRolesService` depending on `environment.api.mode`; unit tests provide their own fake.
 * Failures that the user can fix (duplicate name, protected or used role) are `HttpErrorResponse`s
 * with status 409 and a Spanish `{ message }` body.
 */
export abstract class RolesService {
  /** Lists every role, with its number of users. */
  abstract list(): Observable<Role[]>;

  /**
   * Gets one role.
   * @param {number} id - Role id.
   */
  abstract get(id: number): Observable<Role>;

  /**
   * Creates a role.
   * @param {RoleInput} input - The new role's fields.
   */
  abstract create(input: RoleInput): Observable<Role>;

  /**
   * Replaces a role's fields.
   * @param {number} id - Role id.
   * @param {RoleInput} input - The updated fields.
   */
  abstract update(id: number, input: RoleInput): Observable<Role>;

  /**
   * Deletes a role.
   * @param {number} id - Role id.
   */
  abstract remove(id: number): Observable<void>;
}
