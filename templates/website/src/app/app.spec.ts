import { TestBed } from '@angular/core/testing';
import { environment } from '@env/environment';
import { App } from './app';

describe('App theme', () => {
  const darkClass = 'coto-dark-theme';

  beforeEach(() => localStorage.setItem('coto-ui-kit.theme-mode', 'dark'));

  afterEach(() => {
    environment.theme.darkMode = false;
    localStorage.clear();
    document.documentElement.classList.remove(darkClass);
  });

  it('stays light when dark mode is disabled, even if a dark choice was stored', () => {
    environment.theme.darkMode = false;

    TestBed.createComponent(App);

    expect(document.documentElement.classList.contains(darkClass)).toBe(false);
  });

  it('applies the stored dark choice when dark mode is enabled', () => {
    environment.theme.darkMode = true;

    TestBed.createComponent(App);

    expect(document.documentElement.classList.contains(darkClass)).toBe(true);
  });
});
