import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormField, FormRoot, form, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';

/** Same-origin app routes only: anything else falls back to the home page. */
function safeReturnUrl(url: string | undefined): string {
  return url && url.startsWith('/') && !url.startsWith('//') ? url : '/';
}

@Component({
  selector: 'app-login-page',
  imports: [FormField, FormRoot, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Route to return to after signing in (`?returnUrl=`). */
  readonly returnUrl = input<string>();

  protected readonly isSigning = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly model = signal({ username: '', password: '' });

  protected readonly loginForm = form(this.model, (path) => {
    required(path.username, { message: 'Ingresá tu usuario' });
    required(path.password, { message: 'Ingresá tu contraseña' });
  });

  /** Validates the form and, when valid, signs in and goes to the requested route. */
  async onSubmit(): Promise<void> {
    if (this.isSigning()) return;

    if (this.loginForm().invalid()) {
      this.loginForm().markAsTouched();
      return;
    }

    const { username, password } = this.model();
    this.error.set(null);
    this.isSigning.set(true);
    const result = await this.auth.signIn(username.trim(), password);
    this.isSigning.set(false);

    if (result.ok) {
      await this.router.navigateByUrl(safeReturnUrl(this.returnUrl()));
    } else {
      this.error.set(result.message);
    }
  }
}
