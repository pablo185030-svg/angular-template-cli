import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormField, FormRoot, form, min, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { filter, switchMap } from 'rxjs';
import { ProductInput } from '../../models/product.model';
import { ProductsService } from '../../services/products.service';

@Component({
  selector: 'app-product-form-page',
  imports: [FormField, FormRoot, MatButtonModule, MatFormFieldModule, MatInputModule, RouterLink],
  templateUrl: './product-form-page.html',
  styleUrl: './product-form-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFormPage {
  private readonly products = inject(ProductsService);
  private readonly router = inject(Router);

  /** Product id from the route (`/productos/:id/editar`). Absent when creating. */
  readonly id = input<string>();

  protected readonly isEdit = computed(() => this.id() !== undefined);
  protected readonly isSaving = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly model = signal<ProductInput>({ name: '', price: 0, stock: 0 });

  protected readonly productForm = form(this.model, (path) => {
    required(path.name, { message: 'Ingresá un nombre' });
    min(path.price, 0, { message: 'El precio no puede ser negativo' });
    min(path.stock, 0, { message: 'El stock no puede ser negativo' });
  });

  constructor() {
    // When editing, load the product and fill the form.
    toObservable(this.id)
      .pipe(
        filter((id): id is string => id !== undefined),
        switchMap((id) => this.products.get(Number(id))),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: ({ name, price, stock }) => this.model.set({ name, price, stock }),
        error: () => this.error.set('No se pudo cargar el producto.'),
      });
  }

  /** Validates the form and, when valid, creates or updates the product and returns to the list. */
  onSubmit(): void {
    if (this.isSaving()) return;

    if (this.productForm().invalid()) {
      this.productForm().markAsTouched();
      return;
    }

    const id = this.id();
    const input = this.model();
    const request =
      id === undefined ? this.products.create(input) : this.products.update(Number(id), input);

    this.error.set(null);
    this.isSaving.set(true);
    request.subscribe({
      next: () => this.router.navigate(['/productos']),
      error: () => {
        this.isSaving.set(false);
        this.error.set('No se pudo guardar el producto.');
      },
    });
  }
}
