import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { ConfirmDialog, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog';
import { Product } from '../../models/product.model';
import { ProductsService } from '../../services/products.service';

@Component({
  selector: 'app-products-list-page',
  imports: [CurrencyPipe, MatButtonModule, MatTableModule, RouterLink],
  templateUrl: './products-list-page.html',
  styleUrl: './products-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsListPage {
  private readonly products = inject(ProductsService);
  private readonly dialog = inject(MatDialog);

  protected readonly items = signal<Product[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly columns = ['name', 'price', 'stock', 'actions'];

  constructor() {
    this.load();
  }

  /** Loads the product list from the API. */
  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.products.list().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los productos.');
        this.loading.set(false);
      },
    });
  }

  /**
   * Asks for confirmation and deletes the product only when the user accepts.
   * @param {Product} product - The product to delete.
   */
  confirmDelete(product: Product): void {
    const data: ConfirmDialogData = {
      title: 'Eliminar producto',
      message: `¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
    };

    this.dialog
      .open(ConfirmDialog, { data })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.remove(product);
        }
      });
  }

  private remove(product: Product): void {
    this.error.set(null);
    this.products.remove(product.id).subscribe({
      next: () => this.items.update((items) => items.filter((item) => item.id !== product.id)),
      error: () => this.error.set('No se pudo eliminar el producto.'),
    });
  }
}
