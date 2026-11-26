import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { Role } from '../models/role.model';
import { JsonRolesService } from './json-roles.service';

describe('JsonRolesService', () => {
  const roles = [
    { id: 1, name: 'admin', description: 'Todo', permissions: ['read', 'write', 'manage-roles'] },
    { id: 2, name: 'lectura', description: 'Ver', permissions: ['read'] },
  ];
  const users = [{ roleId: 2 }];
  const input = { name: 'auditor', description: 'Audita', permissions: ['read' as const] };

  function setup() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), JsonRolesService],
    });
    const service = TestBed.inject(JsonRolesService);
    const http = TestBed.inject(HttpTestingController);
    let first = true;

    /** Subscribes and answers the JSON requests the first time (they are loaded once). */
    function run<T>(source: Observable<T>) {
      const out: { value?: T; error?: HttpErrorResponse } = {};
      source.subscribe({
        next: (value) => (out.value = value),
        error: (error) => (out.error = error),
      });
      if (first) {
        first = false;
        http.expectOne('mock/roles.json').flush(roles);
        http.expectOne('mock/users.json').flush(users);
      }
      return out;
    }
    return { service, http, run };
  }

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('lists the roles with their number of users', () => {
    const { service, run } = setup();

    const { value } = run<Role[]>(service.list());

    expect(value?.map((role) => [role.name, role.userCount])).toEqual([
      ['admin', 0],
      ['lectura', 1],
    ]);
  });

  it('creates, updates and deletes a role in memory', () => {
    const { service, run } = setup();

    const created = run<Role>(service.create(input)).value!;
    expect(created.id).toBe(3);

    const updated = run<Role>(service.update(3, { ...input, description: 'Nuevo' })).value!;
    expect(updated.description).toBe('Nuevo');

    run<void>(service.remove(3));
    expect(run<Role[]>(service.list()).value?.map((role) => role.name)).toEqual([
      'admin',
      'lectura',
    ]);
  });

  it('rejects a duplicate name with a Spanish conflict', () => {
    const { service, run } = setup();

    const { error } = run<Role>(service.create({ ...input, name: 'lectura' }));

    expect(error?.status).toBe(409);
    expect(error?.error.message).toBe('Ya existe un rol con ese nombre');
  });

  it('does not modify or delete the admin role', () => {
    const { service, run } = setup();

    expect(run<Role>(service.update(1, input)).error?.status).toBe(409);
    expect(run<void>(service.remove(1)).error?.status).toBe(409);
  });

  it('does not delete a role assigned to a user', () => {
    const { service, run } = setup();

    const { error } = run<void>(service.remove(2));

    expect(error?.status).toBe(409);
    expect(error?.error.message).toBe('El rol tiene usuarios asignados');
  });

  it('answers 404 for an unknown role', () => {
    const { service, run } = setup();

    expect(run<Role>(service.get(99)).error?.status).toBe(404);
  });
});
