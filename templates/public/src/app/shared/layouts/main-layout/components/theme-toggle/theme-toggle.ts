import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { CotoThemeService } from '@coto-dev/ui-kit';

/** Switches between the light and dark themes; the ui-kit service remembers the choice. */
@Component({
  selector: 'app-theme-toggle',
  imports: [MatButtonModule],
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggle {
  private readonly theme = inject(CotoThemeService);

  protected readonly isDark = computed(() => this.theme.mode() === 'dark');

  /** Switches to the other theme. */
  toggle(): void {
    this.theme.toggle();
  }
}
