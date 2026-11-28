import { TestBed } from '@angular/core/testing';
import { MenuToggle } from './menu-toggle';

describe('MenuToggle', () => {
  function setup(open = false) {
    const fixture = TestBed.createComponent(MenuToggle);
    fixture.componentRef.setInput('open', open);
    fixture.componentRef.setInput('controls', 'drawer');
    fixture.detectChanges();
    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[data-testid="menu-toggle"]',
    )!;
    return { fixture, button };
  }

  it('offers to open the menu while it is closed', () => {
    const { button } = setup(false);

    expect(button.getAttribute('aria-label')).toBe('Abrir menú');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-controls')).toBe('drawer');
    expect(button.classList.contains('menu-toggle--open')).toBe(false);
  });

  it('offers to close the menu while it is open', () => {
    const { button } = setup(true);

    expect(button.getAttribute('aria-label')).toBe('Cerrar menú');
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(button.classList.contains('menu-toggle--open')).toBe(true);
  });

  it('emits when clicked', () => {
    const { fixture, button } = setup();
    let emitted = 0;
    fixture.componentInstance.toggled.subscribe(() => emitted++);

    button.click();

    expect(emitted).toBe(1);
  });

  it('moves the focus to the button', () => {
    const { fixture, button } = setup();
    document.body.appendChild(fixture.nativeElement);

    fixture.componentInstance.focus();

    expect(document.activeElement).toBe(button);
    fixture.nativeElement.remove();
  });
});
