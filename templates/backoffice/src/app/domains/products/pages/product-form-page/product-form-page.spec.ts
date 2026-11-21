import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { Product } from '../../models/product.model';
import { ProductsService } from '../../services/products.service';
import { ProductFormPage } from './product-form-page';

const SAVED: Product = { id: 1, name: 'Tea', price: 3, stock: 10 };

describe('ProductFormPage', () => {
  function setup(
    options: { id?: string; get?: Observable<Product>; save?: Observable<Product> } = {},
  ) {
    const service = {
      get: vi.fn(() => options.get ?? of({ id: 5, name: 'Pan lactal', price: 2.2, stock: 300 })),
      create: vi.fn(() => options.save ?? of(SAVED)),
      update: vi.fn(() => options.save ?? of(SAVED)),
    };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: ProductsService, useValue: service }],
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(ProductFormPage);
    if (options.id !== undefined) fixture.componentRef.setInput('id', options.id);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    const field = (testId: string) =>
      element.querySelector<HTMLInputElement>(`[data-testid="${testId}"]`)!;
    const type = async (testId: string, value: string) => {
      const input = field(testId);
      input.value = value;
      input.dispatchEvent(new Event('input'));
      await fixture.whenStable();
    };
    const submit = async () => {
      element
        .querySelector<HTMLFormElement>('[data-testid="product-form"]')!
        .dispatchEvent(new Event('submit'));
      await fixture.whenStable();
      fixture.detectChanges();
    };
    return { fixture, element, service, navigate, field, type, submit };
  }

  it('creates a product with the entered values and returns to the list', async () => {
    const { service, navigate, type, submit } = setup();

    await type('product-name', 'Tea');
    await type('product-price', '3');
    await type('product-stock', '10');
    await submit();

    expect(service.create).toHaveBeenCalledWith({ name: 'Tea', price: 3, stock: 10 });
    expect(navigate).toHaveBeenCalledWith(['/productos']);
  });

  it('shows a validation message and sends nothing when the name is empty', async () => {
    const { element, service, navigate, submit } = setup();

    await submit();

    expect(service.create).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(element.querySelector('mat-error')?.textContent).toContain('Ingresá un nombre');
  });

  it('rejects a negative price', async () => {
    const { element, service, type, submit } = setup();

    await type('product-name', 'Tea');
    await type('product-price', '-1');
    await submit();

    expect(service.create).not.toHaveBeenCalled();
    expect(element.querySelector('mat-error')?.textContent).toContain(
      'El precio no puede ser negativo',
    );
  });

  it('loads the product into the form when editing and saves with update', async () => {
    const { service, navigate, field, type, submit } = setup({ id: '5' });
    await Promise.resolve();

    expect(service.get).toHaveBeenCalledWith(5);
    expect(field('product-name').value).toBe('Pan lactal');

    await type('product-name', 'Pan lactal XL');
    await submit();

    expect(service.update).toHaveBeenCalledWith(5, {
      name: 'Pan lactal XL',
      price: 2.2,
      stock: 300,
    });
    expect(service.create).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/productos']);
  });

  it('shows an error and stays on the page when saving fails', async () => {
    const { element, navigate, type, submit } = setup({
      save: throwError(() => new Error('boom')),
    });

    await type('product-name', 'Tea');
    await submit();

    expect(navigate).not.toHaveBeenCalled();
    expect(element.querySelector('[data-testid="product-error"]')?.textContent).toContain(
      'No se pudo guardar el producto.',
    );
  });

  it('shows an error when the product to edit cannot be loaded', async () => {
    const { fixture, element } = setup({ id: '9', get: throwError(() => new Error('nope')) });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(element.querySelector('[data-testid="product-error"]')?.textContent).toContain(
      'No se pudo cargar el producto.',
    );
  });
});
