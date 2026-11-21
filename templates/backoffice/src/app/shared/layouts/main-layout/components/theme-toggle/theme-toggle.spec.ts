import { TestBed } from '@angular/core/testing';
import { CotoThemeService } from '@coto-dev/ui-kit';
import { ThemeToggle } from './theme-toggle';

describe('ThemeToggle', () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('coto-dark-theme');
  });

  function setup() {
    const fixture = TestBed.createComponent(ThemeToggle);
    fixture.detectChanges();
    const button = () =>
      (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
        '[data-testid="theme-toggle"]',
      )!;
    return { fixture, button };
  }

  it('starts in light mode offering the dark one', () => {
    const { button } = setup();

    expect(button().getAttribute('aria-label')).toBe('Cambiar a modo oscuro');
    expect(button().classList.contains('theme-toggle--dark')).toBe(false);
    expect(button().querySelector('svg')).not.toBeNull();
    expect(document.documentElement.classList.contains('coto-dark-theme')).toBe(false);
  });

  it('switches to the dark theme and back', () => {
    const { fixture, button } = setup();

    button().click();
    fixture.detectChanges();

    expect(TestBed.inject(CotoThemeService).mode()).toBe('dark');
    expect(document.documentElement.classList.contains('coto-dark-theme')).toBe(true);
    expect(button().getAttribute('aria-label')).toBe('Cambiar a modo claro');
    expect(button().classList.contains('theme-toggle--dark')).toBe(true);

    button().click();
    fixture.detectChanges();

    expect(document.documentElement.classList.contains('coto-dark-theme')).toBe(false);
  });
});
