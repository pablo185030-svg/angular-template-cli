import { RESPONSE_INIT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NotFoundPage } from './not-found-page';

describe('NotFoundPage', () => {
  it('sets the response status to 404 when rendering on the server', () => {
    const response: ResponseInit = { status: 200 };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: RESPONSE_INIT, useValue: response }],
    });

    TestBed.createComponent(NotFoundPage);

    expect(response.status).toBe(404);
  });

  it('renders in the browser, where there is no response to change', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });

    const fixture = TestBed.createComponent(NotFoundPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="not-found-page"]')).not.toBeNull();
  });
});
