import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { environment } from '@env/environment';
import { ThemeToggle } from '../theme-toggle/theme-toggle';

@Component({
  selector: 'app-header',
  imports: [NgOptimizedImage, MatButtonModule, RouterLink, RouterLinkActive, ThemeToggle],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  protected readonly darkMode = environment.theme.darkMode;
}
