import { TestBed } from '@angular/core/testing';
import { VersionService } from '@shared/version/version.service';
import { Footer } from './footer';

describe('Footer', () => {
  it('shows the current year and the project name', () => {
    const fixture = TestBed.createComponent(Footer);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement)
      .querySelector('.footer__text')
      ?.textContent?.trim();

    expect(text).toBe(
      `© ${new Date().getFullYear()} COTO coto-angular-template. Todos los derechos reservados.`,
    );
  });

  it('shows the package.json version', () => {
    const fixture = TestBed.createComponent(Footer);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement)
      .querySelector('[data-testid="footer-version"]')
      ?.textContent?.trim();

    expect(text).toBe(`v${TestBed.inject(VersionService).getVersion()}`);
  });
});
