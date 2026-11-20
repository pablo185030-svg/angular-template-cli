import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MainLayout } from './main-layout';
import { AuthService } from '@core/auth/auth.service';
import { FakeAuthService } from '@core/auth/testing/fake-auth.service';
import { AboutPage } from '@domains/about/pages/about-page/about-page';

describe('MainLayout', () => {
  it('renders the header and footer around the routed page', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: new FakeAuthService() },
        provideRouter([
          { path: '', component: MainLayout, children: [{ path: 'about', component: AboutPage }] },
        ]),
      ],
    });

    const harness = await RouterTestingHarness.create('/about');
    const element = harness.routeNativeElement as HTMLElement;
    const layout = element.querySelector('[data-testid="main-layout"]');

    expect(layout).not.toBeNull();
    expect(layout?.querySelector('[data-testid="header"]')).not.toBeNull();
    expect(layout?.querySelector('main [data-testid="about-page"]')).not.toBeNull();
    expect(layout?.querySelector('[data-testid="footer"]')).not.toBeNull();
  });
});
