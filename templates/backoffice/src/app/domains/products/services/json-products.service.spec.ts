import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { JsonProductsService } from './json-products.service';

describe('JsonProductsService', () => {
  const seed = [
    { id: 1, name: 'Leche entera 1L', price: 1450, stock: 120 },
    { id: 2, name: 'Pan lactal 400g', price: 2300, stock: 80 },
  ];

  function setup() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), JsonProductsService],
    });
    const service = TestBed.inject(JsonProductsService);
    const http = TestBed.inject(HttpTestingController);
    return { service, http };
  }

  /** Lists once, answering the single JSON request. */
  function load(service: JsonProductsService, http: HttpTestingController) {
    let result: unknown;
    service.list().subscribe((products) => (result = products));
    http.expectOne('mock/products.json').flush(seed);
    return result;
  }

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('lists the products from the JSON file', () => {
    const { service, http } = setup();

    expect(load(service, http)).toEqual(seed);
  });

  it('loads the JSON file only once', () => {
    const { service, http } = setup();
    load(service, http);

    service.list().subscribe();
    service.get(1).subscribe();

    http.expectNone('mock/products.json');
  });

  it('creates a product with the next id and lists it', () => {
    const { service, http } = setup();
    load(service, http);
    let created: unknown;
    let listed: unknown[] = [];

    service.create({ name: 'Azúcar 1kg', price: 1250, stock: 5 }).subscribe((p) => (created = p));
    service.list().subscribe((products) => (listed = products));

    expect(created).toEqual({ id: 3, name: 'Azúcar 1kg', price: 1250, stock: 5 });
    expect(listed).toHaveLength(3);
  });

  it('updates a product', () => {
    const { service, http } = setup();
    load(service, http);
    let product: unknown;

    service.update(2, { name: 'Pan lactal XL', price: 2500, stock: 70 }).subscribe();
    service.get(2).subscribe((p) => (product = p));

    expect(product).toEqual({ id: 2, name: 'Pan lactal XL', price: 2500, stock: 70 });
  });

  it('deletes a product', () => {
    const { service, http } = setup();
    load(service, http);
    let listed: unknown[] = [];

    service.remove(1).subscribe();
    service.list().subscribe((products) => (listed = products));

    expect(listed).toEqual([seed[1]]);
  });

  it('fails with a 404 for an unknown product', () => {
    const { service, http } = setup();
    load(service, http);
    const statuses: number[] = [];

    service.get(99).subscribe({ error: (e) => statuses.push(e.status) });
    service.update(99, { name: 'x', price: 1, stock: 1 }).subscribe({
      error: (e) => statuses.push(e.status),
    });
    service.remove(99).subscribe({ error: (e) => statuses.push(e.status) });

    expect(statuses).toEqual([404, 404, 404]);
  });

  it('does not change the loaded data when the caller mutates a result', () => {
    const { service, http } = setup();
    const first = load(service, http) as { name: string }[];
    first[0].name = 'changed';
    let again: { name: string }[] = [];

    service.list().subscribe((products) => (again = products));

    expect(again[0].name).toBe('Leche entera 1L');
  });
});
