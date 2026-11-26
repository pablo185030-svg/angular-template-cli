import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, shareReplay, tap } from 'rxjs';
import { ADMIN_ROLE_NAME, Role, RoleInput } from '../models/role.model';
import { RolesService } from './roles.service';

const notFound = () => new HttpErrorResponse({ status: 404, statusText: 'Not Found' });
const conflict = (message: string) =>
  new HttpErrorResponse({ status: 409, statusText: 'Conflict', error: { message } });

/**
 * Roles CRUD without a server: loads `mock/roles.json` and `mock/users.json` once and applies
 * every change in browser memory. Changes are lost when the page is reloaded. Replace it with
 * `HttpRolesService` (`api.mode: 'http'`) when you have a backend.
 */
@Injectable()
export class JsonRolesService extends RolesService {
  private readonly http = inject(HttpClient);
  private items: Role[] = [];
  private userRoleIds: number[] = [];
  private nextId = 1;

  private readonly loaded$ = forkJoin({
    roles: this.http.get<Role[]>('mock/roles.json'),
    users: this.http.get<{ roleId: number }[]>('mock/users.json'),
  }).pipe(
    tap(({ roles, users }) => {
      this.items = roles.map((role) => ({ ...role, permissions: [...role.permissions] }));
      this.userRoleIds = users.map((user) => user.roleId);
      this.nextId = Math.max(0, ...roles.map((role) => role.id)) + 1;
    }),
    shareReplay(1),
  );

  /** @inheritdoc */
  list(): Observable<Role[]> {
    return this.loaded$.pipe(map(() => this.items.map((item) => this.view(item))));
  }

  /** @inheritdoc */
  get(id: number): Observable<Role> {
    return this.loaded$.pipe(map(() => this.view(this.find(id))));
  }

  /** @inheritdoc */
  create(input: RoleInput): Observable<Role> {
    return this.loaded$.pipe(
      map(() => {
        this.assertNameFree(input.name);
        const created = { id: this.nextId++, ...input, permissions: [...input.permissions] };
        this.items.push(created);
        return this.view(created);
      }),
    );
  }

  /** @inheritdoc */
  update(id: number, input: RoleInput): Observable<Role> {
    return this.loaded$.pipe(
      map(() => {
        const current = this.find(id);
        if (current.name === ADMIN_ROLE_NAME) throw conflict('El rol admin no se puede modificar');
        this.assertNameFree(input.name, id);
        Object.assign(current, input, { permissions: [...input.permissions] });
        return this.view(current);
      }),
    );
  }

  /** @inheritdoc */
  remove(id: number): Observable<void> {
    return this.loaded$.pipe(
      map(() => {
        const current = this.find(id);
        if (current.name === ADMIN_ROLE_NAME) throw conflict('El rol admin no se puede eliminar');
        if (this.userCount(id) > 0) throw conflict('El rol tiene usuarios asignados');
        this.items.splice(this.items.indexOf(current), 1);
      }),
    );
  }

  private find(id: number): Role {
    const role = this.items.find((item) => item.id === id);
    if (!role) throw notFound();
    return role;
  }

  private assertNameFree(name: string, ignoreId?: number): void {
    if (this.items.some((item) => item.name === name.trim() && item.id !== ignoreId)) {
      throw conflict('Ya existe un rol con ese nombre');
    }
  }

  private userCount(id: number): number {
    return this.userRoleIds.filter((roleId) => roleId === id).length;
  }

  private view(role: Role): Role {
    return { ...role, permissions: [...role.permissions], userCount: this.userCount(role.id) };
  }
}
