import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { Role } from '../../models/role.model';
import { RolesService } from '../../services/roles.service';
import { RoleFormPage } from './role-form-page';

describe('RoleFormPage', () => {
  function setup(options: { id?: string; role?: Role; save?: Observable<Role> } = {}) {
    const saved: Role = { id: 9, name: 'x', description: '', permissions: ['read'] };
    const service = {
      get: vi.fn(() => of(options.role)),
      create: vi.fn(() => options.save ?? of(saved)),
      update: vi.fn(() => options.save ?? of(saved)),
    };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: RolesService, useValue: service }],
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(RoleFormPage);
    if (options.id) fixture.componentRef.setInput('id', options.id);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const byId = (id: string) => element.querySelector<HTMLElement>(`[data-testid="${id}"]`);
    const type = (id: string, value: string) => {
      const input = byId(id) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };
    const submit = async () => {
      byId('role-form')!.dispatchEvent(new Event('submit'));
      await fixture.whenStable();
      fixture.detectChanges();
    };
    return { fixture, element, service, navigate, byId, type, submit };
  }

  it('shows a Spanish validation message and does not save when the name is empty', async () => {
    const { element, service, submit } = setup();

    await submit();

    expect(element.textContent).toContain('Ingresá un nombre');
    expect(service.create).not.toHaveBeenCalled();
  });

  it('requires the read permission', async () => {
    const { byId, type, submit, service, fixture } = setup();
    type('role-name', 'auditor');
    byId('role-permission-read')!.querySelector('input')!.click();
    fixture.detectChanges();

    await submit();

    expect(byId('role-permissions-error')?.textContent).toContain('Ver');
    expect(service.create).not.toHaveBeenCalled();
  });

  it('creates a role with the chosen permissions and returns to the list', async () => {
    const { byId, type, submit, service, navigate, fixture } = setup();
    type('role-name', ' auditor ');
    type('role-description', 'Audita');
    byId('role-permission-write')!.querySelector('input')!.click();
    fixture.detectChanges();

    await submit();

    expect(service.create).toHaveBeenCalledWith({
      name: 'auditor',
      description: 'Audita',
      permissions: ['read', 'write'],
    });
    expect(navigate).toHaveBeenCalledWith(['/roles']);
  });

  it('shows the duplicate-name message from the server', async () => {
    const conflict = new HttpErrorResponse({
      status: 409,
      error: { message: 'Ya existe un rol con ese nombre' },
    });
    const { byId, type, submit } = setup({ save: throwError(() => conflict) });
    type('role-name', 'lectura');

    await submit();

    expect(byId('role-error')?.textContent).toContain('Ya existe un rol con ese nombre');
  });

  it('loads a role to edit and saves it with update', async () => {
    const role: Role = { id: 3, name: 'auditor', description: 'Audita', permissions: ['read'] };
    const { byId, submit, service } = setup({ id: '3', role });

    expect((byId('role-name') as HTMLInputElement).value).toBe('auditor');
    await submit();

    expect(service.update).toHaveBeenCalledWith(3, {
      name: 'auditor',
      description: 'Audita',
      permissions: ['read'],
    });
  });

  it('shows the admin role read-only, without a save button', async () => {
    const role: Role = {
      id: 1,
      name: 'admin',
      description: 'Todo',
      permissions: ['read', 'write', 'manage-roles'],
    };
    const { byId, submit, service } = setup({ id: '1', role });

    expect(byId('role-protected')).not.toBeNull();
    expect(byId('role-save')).toBeNull();
    expect((byId('role-name') as HTMLInputElement).readOnly).toBe(true);
    await submit();
    expect(service.update).not.toHaveBeenCalled();
  });
});
