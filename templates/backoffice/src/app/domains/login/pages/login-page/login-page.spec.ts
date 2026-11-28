import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { FakeAuthService } from '@core/auth/testing/fake-auth.service';
import { LoginPage } from './login-page';

describe('LoginPage', () => {
  function setup(returnUrl?: string) {
    const auth = new FakeAuthService();
    const navigateByUrl = vi.fn(() => Promise.resolve(true));
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: { navigateByUrl } },
      ],
    });
    const fixture = TestBed.createComponent(LoginPage);
    if (returnUrl !== undefined) fixture.componentRef.setInput('returnUrl', returnUrl);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const byId = <T extends HTMLElement>(id: string) =>
      root.querySelector<T>(`[data-testid="${id}"]`);

    async function submit(username: string, password: string) {
      for (const [id, value] of [
        ['login-username', username],
        ['login-password', password],
      ]) {
        const input = byId<HTMLInputElement>(id)!;
        input.value = value;
        input.dispatchEvent(new Event('input'));
      }
      fixture.detectChanges();
      byId('login-form')!.dispatchEvent(new Event('submit'));
      await fixture.whenStable();
      fixture.detectChanges();
    }
    return { auth, navigateByUrl, byId, submit, root };
  }

  it('shows the demo user hint', () => {
    const { byId } = setup();

    expect(byId('login-hint')?.textContent).toContain('admin');
    expect(byId('login-hint')?.textContent).toContain('1234');
  });

  it('shows validation messages in Spanish and sends nothing when fields are empty', async () => {
    const { auth, submit, root } = setup();

    await submit('', '');

    expect(root.textContent).toContain('Ingresá tu usuario');
    expect(root.textContent).toContain('Ingresá tu contraseña');
    expect(auth.signInCalls).toEqual([]);
  });

  it('signs in and goes to the requested route', async () => {
    const { auth, navigateByUrl, submit } = setup('/productos');

    await submit('admin', '1234');

    expect(auth.signInCalls).toEqual([['admin', '1234']]);
    expect(navigateByUrl).toHaveBeenCalledWith('/productos');
  });

  it('goes to the home page when there is no or an unsafe return URL', async () => {
    const first = setup('//evil.example');
    await first.submit('admin', '1234');
    expect(first.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('shows the error and stays on the page when the sign-in fails', async () => {
    const { auth, navigateByUrl, byId, submit } = setup();
    auth.signInResult = { ok: false, message: 'Usuario o contraseña incorrectos.' };

    await submit('admin', 'nope');

    expect(byId('login-error')?.textContent).toContain('Usuario o contraseña incorrectos.');
    expect(navigateByUrl).not.toHaveBeenCalled();
  });
});
