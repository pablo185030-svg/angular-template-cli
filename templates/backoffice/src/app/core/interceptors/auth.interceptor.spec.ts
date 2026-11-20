import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '@env/environment';
import { AuthService } from '@core/auth/auth.service';
import { FakeAuthService } from '@core/auth/testing/fake-auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  function setup(token: string | null) {
    const auth = new FakeAuthService();
    auth.token = token;
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    return { http: TestBed.inject(HttpClient), controller: TestBed.inject(HttpTestingController) };
  }

  it('adds the bearer token to requests to the API base URL', () => {
    const { http, controller } = setup('abc');

    http.get(`${environment.apiBaseUrl}/products`).subscribe();

    const req = controller.expectOne(`${environment.apiBaseUrl}/products`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc');
  });

  it('does not add the token to other origins', () => {
    const { http, controller } = setup('abc');

    http.get('https://other.example.com/data').subscribe();

    expect(
      controller.expectOne('https://other.example.com/data').request.headers.has('Authorization'),
    ).toBe(false);
  });

  it('does not add the token to a path that only shares the API prefix', () => {
    const { http, controller } = setup('abc');
    const url = `${environment.apiBaseUrl}-docs/readme`;

    http.get(url).subscribe();

    expect(controller.expectOne(url).request.headers.has('Authorization')).toBe(false);
  });

  it('sends the request unchanged when there is no token', () => {
    const { http, controller } = setup(null);

    http.get(`${environment.apiBaseUrl}/products`).subscribe();

    expect(
      controller
        .expectOne(`${environment.apiBaseUrl}/products`)
        .request.headers.has('Authorization'),
    ).toBe(false);
  });
});
