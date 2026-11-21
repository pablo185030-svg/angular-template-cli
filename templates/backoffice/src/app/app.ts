import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CotoThemeService } from '@coto-dev/ui-kit';
import { environment } from '@env/environment';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  constructor() {
    // The service applies the stored theme when it is created. When dark mode is not enabled it
    // is never created, so the app is always light, even if a dark choice was stored.
    if (environment.theme.darkMode) inject(CotoThemeService);
  }
}
