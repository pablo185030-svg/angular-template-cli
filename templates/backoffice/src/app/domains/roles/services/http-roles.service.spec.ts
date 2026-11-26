import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '@env/environment';
import { HttpRolesService } from './http-roles.service';

describe('HttpRolesService', () => {
  const input = { name: 'auditor', description: 'Audita', permissions: ['read' as const] };

  function setup() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), HttpRolesService],
    });
    return {
      service: TestBed.inject(HttpRolesService),
      http: TestBed.inject(HttpTestingController),
    };
  }

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('calls the roles endpoints under the API base URL', () => {
    const { service, http } = setup();
    const url = `${environment.apiBaseUrl}/roles`;

    service.list().subscribe();
    expect(http.expectOne(url).request.method).toBe('GET');

    service.get(3).subscribe();
    expect(http.expectOne(`${url}/3`).request.method).toBe('GET');

    service.create(input).subscribe();
    const create = http.expectOne(url);
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual(input);

    service.update(3, input).subscribe();
    expect(http.expectOne(`${url}/3`).request.method).toBe('PUT');

    service.remove(3).subscribe();
    expect(http.expectOne(`${url}/3`).request.method).toBe('DELETE');
  });
});
