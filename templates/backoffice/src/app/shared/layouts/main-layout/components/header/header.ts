import { DOCUMENT, NgOptimizedImage, NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  DestroyRef,
  PLATFORM_ID,
  afterNextRender,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { environment } from '@env/environment';
import { MenuToggle } from '../menu-toggle/menu-toggle';
import { ThemeToggle } from '../theme-toggle/theme-toggle';

/** Same value as the ui-kit `tablet-portrait` breakpoint: from here up the navigation is inline. */
const DESKTOP_QUERY = '(min-width: 768px)';

@Component({
  selector: 'app-header',
  imports: [
    NgOptimizedImage,
    NgTemplateOutlet,
    A11yModule,
    MatButtonModule,
    RouterLink,
    RouterLinkActive,
    MenuToggle,
    ThemeToggle,
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closeMenu()' },
})
export class Header {
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly menuToggle = viewChild.required(MenuToggle);

  protected readonly auth = inject(AuthService);
  protected readonly darkMode = environment.theme.darkMode;
  protected readonly menuOpen = signal(false);

  constructor() {
    // The drawer is hidden by CSS on wide screens; also reset its state so the scroll lock goes away.
    if (isPlatformBrowser(inject(PLATFORM_ID)) && typeof matchMedia === 'function') {
      const query = matchMedia(DESKTOP_QUERY);
      const onChange = (event: MediaQueryListEvent) => {
        if (event.matches) {
          this.menuOpen.set(false);
        }
      };
      query.addEventListener('change', onChange);
      this.destroyRef.onDestroy(() => query.removeEventListener('change', onChange));
    }

    effect((onCleanup) => {
      if (this.menuOpen()) {
        this.document.body.classList.add('no-scroll');
        onCleanup(() => this.document.body.classList.remove('no-scroll'));
      }
    });
  }

  /** Opens the drawer when closed and closes it when open. */
  toggleMenu(): void {
    if (this.menuOpen()) {
      this.closeMenu();
    } else {
      this.menuOpen.set(true);
    }
  }

  /** Closes the drawer when a link inside it (non-empty test id prefix) is activated. */
  protected onLinkClick(prefix: string): void {
    if (prefix) {
      this.closeMenu();
    }
  }

  /** Closes the drawer and gives the focus back to the hamburger button. */
  closeMenu(): void {
    if (!this.menuOpen()) {
      return;
    }
    this.menuOpen.set(false);
    afterNextRender(() => this.menuToggle().focus(), { injector: this.injector });
  }

  /** Ends the session and sends the user to the Keycloak logout. */
  logout(): void {
    this.auth.logout();
  }
}
