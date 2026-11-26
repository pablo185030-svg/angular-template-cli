import { TestBed } from '@angular/core/testing';
import { VersionService } from '@shared/version/version.service';
import { Footer } from './footer';

describe('Footer', () => {
  it('shows the current year, the project name and the version in one line', () => {
    const fixture = TestBed.createComponent(Footer);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement)
      .querySelector('.footer__text')
      ?.textContent?.replace(/\s+/g, ' ')
      .trim();

    expect(text).toBe(
      `${new Date().getFullYear()} COTO - coto-angular-template. Versión ${TestBed.inject(VersionService).getVersion()}`,
    );
  });

  it('shows the package.json version', () => {
    const fixture = TestBed.createComponent(Footer);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement)
      .querySelector('[data-testid="footer-version"]')
      ?.textContent?.trim();

    expect(text).toBe(`Versión ${TestBed.inject(VersionService).getVersion()}`);
  });
});
