import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';

describe('app routes', () => {
  async function navigate(url: string) {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    const harness = await RouterTestingHarness.create(url);
    return harness.routeNativeElement as HTMLElement;
  }

  it('shows the home page at "/"', async () => {
    const element = await navigate('/');

    expect(element.querySelector('[data-testid="home-page"]')).not.toBeNull();
    expect(element.querySelector('[data-testid="header"]')).not.toBeNull();
  });

  it('shows the about page at "/about"', async () => {
    const element = await navigate('/about');

    expect(element.querySelector('[data-testid="about-page"]')).not.toBeNull();
    expect(element.querySelector('[data-testid="footer"]')).not.toBeNull();
  });

  it('shows the not-found page inside the layout for an unknown path', async () => {
    const element = await navigate('/does-not-exist');

    expect(element.querySelector('main [data-testid="not-found-page"]')).not.toBeNull();
    expect(element.querySelector('[data-testid="header"]')).not.toBeNull();
    expect(element.querySelector('[data-testid="home-page"]')).toBeNull();
  });
});
