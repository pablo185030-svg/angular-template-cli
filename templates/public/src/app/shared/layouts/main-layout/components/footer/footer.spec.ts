import { TestBed } from '@angular/core/testing';
import { Footer } from './footer';

describe('Footer', () => {
  it('shows the current year and the project name', () => {
    const fixture = TestBed.createComponent(Footer);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement)
      .querySelector('[data-testid="footer"]')
      ?.textContent?.trim();

    expect(text).toBe(
      `© ${new Date().getFullYear()} coto-angular-template. Todos los derechos reservados.`,
    );
  });
});
