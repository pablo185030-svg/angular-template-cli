import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';

@Component({
  selector: 'app-header',
  imports: [NgOptimizedImage, MatButtonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  protected readonly auth = inject(AuthService);

  /** Ends the session and sends the user to the Keycloak logout. */
  logout(): void {
    this.auth.logout();
  }
}
