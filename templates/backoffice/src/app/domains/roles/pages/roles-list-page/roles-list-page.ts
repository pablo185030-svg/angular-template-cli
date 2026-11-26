import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { PERMISSION_LABELS, Permission } from '@core/auth/models/permission.model';
import { ConfirmDialog, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog';
import { ADMIN_ROLE_NAME, Role } from '../../models/role.model';
import { RolesService } from '../../services/roles.service';

@Component({
  selector: 'app-roles-list-page',
  imports: [MatButtonModule, MatTableModule, RouterLink],
  templateUrl: './roles-list-page.html',
  styleUrl: './roles-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesListPage {
  private readonly roles = inject(RolesService);
  private readonly dialog = inject(MatDialog);

  protected readonly items = signal<Role[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly columns = ['name', 'description', 'permissions', 'actions'];

  constructor() {
    this.load();
  }

  /** Loads the roles from the API. */
  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.roles.list().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los roles.');
        this.loading.set(false);
      },
    });
  }

  /**
   * Tells whether the role can be deleted: not the admin role and not assigned to a user.
   * @param {Role} role - The role to check.
   */
  protected canDelete(role: Role): boolean {
    return role.name !== ADMIN_ROLE_NAME && !role.userCount;
  }

  /**
   * Joins the Spanish labels of the role's permissions.
   * @param {Permission[]} permissions - Permissions to describe.
   */
  protected describe(permissions: Permission[]): string {
    return permissions.map((permission) => PERMISSION_LABELS[permission]).join(', ');
  }

  /**
   * Asks for confirmation and deletes the role only when the user accepts.
   * @param {Role} role - The role to delete.
   */
  confirmDelete(role: Role): void {
    const data: ConfirmDialogData = {
      title: 'Eliminar rol',
      message: `¿Eliminar el rol "${role.name}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
    };

    this.dialog
      .open(ConfirmDialog, { data })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.remove(role);
        }
      });
  }

  private remove(role: Role): void {
    this.error.set(null);
    this.roles.remove(role.id).subscribe({
      next: () => this.items.update((items) => items.filter((item) => item.id !== role.id)),
      error: (error: HttpErrorResponse) =>
        this.error.set(
          error.status === 409 && error.error?.message
            ? error.error.message
            : 'No se pudo eliminar el rol.',
        ),
    });
  }
}
