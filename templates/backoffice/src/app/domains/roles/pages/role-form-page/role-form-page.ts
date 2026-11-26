import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormField, FormRoot, form, readonly, required, validate } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { filter, switchMap } from 'rxjs';
import { PERMISSIONS, PERMISSION_LABELS, Permission } from '@core/auth/models/permission.model';
import { ADMIN_ROLE_NAME, RoleInput } from '../../models/role.model';
import { RolesService } from '../../services/roles.service';

@Component({
  selector: 'app-role-form-page',
  imports: [
    FormField,
    FormRoot,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    RouterLink,
  ],
  templateUrl: './role-form-page.html',
  styleUrl: './role-form-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleFormPage {
  private readonly roles = inject(RolesService);
  private readonly router = inject(Router);

  /** Role id from the route (`/roles/:id/editar`). Absent when creating. */
  readonly id = input<string>();

  protected readonly permissions = PERMISSIONS;
  protected readonly permissionLabels = PERMISSION_LABELS;
  protected readonly isEdit = computed(() => this.id() !== undefined);
  protected readonly isSaving = signal(false);
  protected readonly error = signal<string | null>(null);
  /** The admin role cannot be edited: its fields are shown read-only. */
  protected readonly isProtected = signal(false);

  private readonly model = signal<RoleInput>({ name: '', description: '', permissions: ['read'] });

  protected readonly roleForm = form(this.model, (path) => {
    required(path.name, { message: 'Ingresá un nombre' });
    validate(path.permissions, ({ value }) =>
      value().includes('read')
        ? null
        : { kind: 'read-required', message: 'El rol debe poder ver (permiso "Ver")' },
    );
    readonly(path.name, { when: () => this.isProtected() });
    readonly(path.description, { when: () => this.isProtected() });
  });

  constructor() {
    // When editing, load the role and fill the form.
    toObservable(this.id)
      .pipe(
        filter((id): id is string => id !== undefined),
        switchMap((id) => this.roles.get(Number(id))),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: ({ name, description, permissions }) => {
          this.isProtected.set(name === ADMIN_ROLE_NAME);
          this.model.set({ name, description, permissions });
        },
        error: () => this.error.set('No se pudo cargar el rol.'),
      });
  }

  /**
   * Tells whether the role has a permission.
   * @param {Permission} permission - Permission to check.
   */
  protected has(permission: Permission): boolean {
    return this.model().permissions.includes(permission);
  }

  /**
   * Adds or removes a permission from the role being edited.
   * @param {Permission} permission - Permission to toggle.
   * @param {boolean} checked - Whether it is now selected.
   */
  protected toggle(permission: Permission, checked: boolean): void {
    this.model.update((role) => ({
      ...role,
      permissions: PERMISSIONS.filter((p) =>
        p === permission ? checked : role.permissions.includes(p),
      ),
    }));
    this.roleForm.permissions().markAsTouched();
  }

  /** Validates the form and, when valid, creates or updates the role and returns to the list. */
  onSubmit(): void {
    if (this.isSaving() || this.isProtected()) return;

    if (this.roleForm().invalid()) {
      this.roleForm().markAsTouched();
      this.roleForm.permissions().markAsTouched();
      return;
    }

    const id = this.id();
    const { name, description, permissions } = this.model();
    const input: RoleInput = { name: name.trim(), description: description.trim(), permissions };
    const request =
      id === undefined ? this.roles.create(input) : this.roles.update(Number(id), input);

    this.error.set(null);
    this.isSaving.set(true);
    request.subscribe({
      next: () => this.router.navigate(['/roles']),
      error: (error: HttpErrorResponse) => {
        this.isSaving.set(false);
        this.error.set(
          error.status === 409 && error.error?.message
            ? error.error.message
            : 'No se pudo guardar el rol.',
        );
      },
    });
  }
}
