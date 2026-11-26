import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { Role } from '../../models/role.model';
import { RolesService } from '../../services/roles.service';
import { RolesListPage } from './roles-list-page';

const ROLES: Role[] = [
  {
    id: 1,
    name: 'admin',
    description: 'Todo',
    permissions: ['read', 'write', 'manage-roles'],
    userCount: 1,
  },
  { id: 2, name: 'lectura', description: 'Ver', permissions: ['read'], userCount: 1 },
  { id: 3, name: 'auditor', description: 'Audita', permissions: ['read'], userCount: 0 },
];

describe('RolesListPage', () => {
  function setup(
    options: { list?: Observable<Role[]>; remove?: Observable<void>; confirmed?: boolean } = {},
  ) {
    const service = {
      list: vi.fn(() => options.list ?? of(ROLES)),
      remove: vi.fn(() => options.remove ?? of(undefined)),
    };
    const dialog = { open: vi.fn(() => ({ afterClosed: () => of(options.confirmed ?? true) })) };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: RolesService, useValue: service },
        { provide: MatDialog, useValue: dialog },
      ],
    });
    const fixture = TestBed.createComponent(RolesListPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const byId = (id: string) => element.querySelector<HTMLElement>(`[data-testid="${id}"]`);
    return {
      fixture,
      element,
      service,
      dialog,
      byId,
      rows: () => element.querySelectorAll('[data-testid="role-row"]'),
    };
  }

  it('lists the roles with their description and Spanish permission names', () => {
    const { rows } = setup();

    expect(rows().length).toBe(3);
    expect(rows()[1].textContent).toContain('lectura');
    expect(rows()[1].textContent).toContain('Ver');
    expect(rows()[0].textContent).toContain('Administrar roles');
  });

  it('offers delete only for roles that are not admin and have no users', () => {
    const { byId } = setup();

    expect(byId('delete-role-1')).toBeNull();
    expect(byId('delete-role-2')).toBeNull();
    expect(byId('delete-role-3')).not.toBeNull();
  });

  it('deletes a role after the user confirms', () => {
    const { byId, rows, service, fixture } = setup();

    byId('delete-role-3')!.click();
    fixture.detectChanges();

    expect(service.remove).toHaveBeenCalledWith(3);
    expect(rows().length).toBe(2);
  });

  it('keeps the role when the user cancels', () => {
    const { byId, rows, service } = setup({ confirmed: false });

    byId('delete-role-3')!.click();

    expect(service.remove).not.toHaveBeenCalled();
    expect(rows().length).toBe(3);
  });

  it('shows the server message when the delete is refused', () => {
    const conflict = new HttpErrorResponse({
      status: 409,
      error: { message: 'El rol tiene usuarios asignados' },
    });
    const { byId, fixture } = setup({ remove: throwError(() => conflict) });

    byId('delete-role-3')!.click();
    fixture.detectChanges();

    expect(byId('roles-error')?.textContent).toContain('El rol tiene usuarios asignados');
  });

  it('shows an empty state and an error state', () => {
    expect(setup({ list: of([]) }).byId('roles-empty')).not.toBeNull();
    TestBed.resetTestingModule();
    expect(
      setup({ list: throwError(() => new Error('x')) }).byId('roles-error')?.textContent,
    ).toContain('No se pudieron cargar los roles.');
  });
});
