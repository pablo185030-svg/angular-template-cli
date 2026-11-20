import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '@env/environment';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  const url = `${environment.apiBaseUrl}/products`;
  const input = { name: 'Tea', price: 3, stock: 10 };

  function setup() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    return {
      service: TestBed.inject(ProductsService),
      http: TestBed.inject(HttpTestingController),
    };
  }

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('lists products with GET', () => {
    const { service, http } = setup();
    let result: unknown;

    service.list().subscribe((products) => (result = products));
    const req = http.expectOne(url);
    req.flush([{ id: 1, ...input }]);

    expect(req.request.method).toBe('GET');
    expect(result).toEqual([{ id: 1, ...input }]);
  });

  it('gets one product by id', () => {
    const { service, http } = setup();

    service.get(7).subscribe();

    const req = http.expectOne(`${url}/7`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 7, ...input });
  });

  it('creates a product with POST and the given body', () => {
    const { service, http } = setup();

    service.create(input).subscribe();

    const req = http.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush({ id: 9, ...input });
  });

  it('updates a product with PUT and the given body', () => {
    const { service, http } = setup();

    service.update(2, input).subscribe();

    const req = http.expectOne(`${url}/2`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(input);
    req.flush({ id: 2, ...input });
  });

  it('deletes a product with DELETE', () => {
    const { service, http } = setup();

    service.remove(2).subscribe();

    const req = http.expectOne(`${url}/2`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('propagates API errors to the caller', () => {
    const { service, http } = setup();
    let status: number | undefined;

    service.list().subscribe({ error: (error) => (status = error.status) });
    http.expectOne(url).flush('boom', { status: 500, statusText: 'Server Error' });

    expect(status).toBe(500);
  });
});
