import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

/** Hamburger button that morphs into a close icon while the menu it controls is open. */
@Component({
  selector: 'app-menu-toggle',
  imports: [MatButtonModule],
  templateUrl: './menu-toggle.html',
  styleUrl: './menu-toggle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuToggle {
  /** Whether the controlled menu is open. */
  readonly open = input(false);
  /** Id of the element the button controls (for `aria-controls`). */
  readonly controls = input<string>();
  /** Emits when the user activates the button. */
  readonly toggled = output<void>();

  private readonly button = viewChild.required('button', { read: ElementRef<HTMLButtonElement> });

  /** Moves the keyboard focus to the button. */
  focus(): void {
    this.button().nativeElement.focus();
  }
}
