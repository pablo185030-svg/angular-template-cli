import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { Product } from '../../models/product.model';
import { ProductsService } from '../../services/products.service';
import { ProductsListPage } from './products-list-page';

const PRODUCTS: Product[] = [
  { id: 1, name: 'Olive oil', price: 8.5, stock: 120 },
  { id: 2, name: 'Pasta', price: 2.2, stock: 300 },
];

describe('ProductsListPage', () => {
  function setup(options: {
    list?: Observable<Product[]>;
    remove?: Observable<void>;
    confirmed?: boolean;
  }) {
    const service = {
      list: vi.fn(() => options.list ?? of(PRODUCTS)),
      remove: vi.fn(() => options.remove ?? of(undefined)),
    };
    const dialog = { open: vi.fn(() => ({ afterClosed: () => of(options.confirmed ?? true) })) };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ProductsService, useValue: service },
        { provide: MatDialog, useValue: dialog },
      ],
    });
    const fixture = TestBed.createComponent(ProductsListPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const rows = () => element.querySelectorAll('[data-testid="product-row"]');
    return { fixture, element, service, dialog, rows };
  }

  it('lists the products returned by the API', () => {
    const { element, rows } = setup({});

    expect(rows().length).toBe(2);
    expect(rows()[0].textContent).toContain('Olive oil');
    expect(rows()[0].textContent).toContain('$8.50');
    expect(rows()[1].textContent).toContain('Pasta');
    expect(element.querySelector('[data-testid="products-empty"]')).toBeNull();
  });

  it('shows an empty state when there are no products', () => {
    const { element, rows } = setup({ list: of([]) });

    expect(rows().length).toBe(0);
    expect(element.querySelector('[data-testid="products-empty"]')).not.toBeNull();
  });

  it('shows an error and no empty state when loading fails', () => {
    const { element } = setup({ list: throwError(() => new Error('boom')) });

    expect(element.querySelector('[data-testid="products-error"]')?.textContent).toContain(
      'Could not load the products.',
    );
    expect(element.querySelector('[data-testid="products-empty"]')).toBeNull();
  });

  it('links each row to its edit page', () => {
    const { element } = setup({});

    const link = element.querySelector<HTMLAnchorElement>('[data-testid="edit-product-2"]');

    expect(link?.getAttribute('href')).toBe('/products/2/edit');
  });

  it('removes the row after the user confirms the deletion', () => {
    const { fixture, element, service, dialog, rows } = setup({ confirmed: true });

    element.querySelector<HTMLButtonElement>('[data-testid="delete-product-1"]')?.click();
    fixture.detectChanges();

    expect(dialog.open).toHaveBeenCalledTimes(1);
    expect(service.remove).toHaveBeenCalledWith(1);
    expect(rows().length).toBe(1);
    expect(rows()[0].textContent).toContain('Pasta');
  });

  it('keeps the product when the user cancels the deletion', () => {
    const { fixture, element, service, rows } = setup({ confirmed: false });

    element.querySelector<HTMLButtonElement>('[data-testid="delete-product-1"]')?.click();
    fixture.detectChanges();

    expect(service.remove).not.toHaveBeenCalled();
    expect(rows().length).toBe(2);
  });

  it('keeps the row and shows an error when the deletion fails', () => {
    const { fixture, element, rows } = setup({
      confirmed: true,
      remove: throwError(() => new Error('boom')),
    });

    element.querySelector<HTMLButtonElement>('[data-testid="delete-product-1"]')?.click();
    fixture.detectChanges();

    expect(rows().length).toBe(2);
    expect(element.querySelector('[data-testid="products-error"]')?.textContent).toContain(
      'Could not delete the product.',
    );
  });
});
