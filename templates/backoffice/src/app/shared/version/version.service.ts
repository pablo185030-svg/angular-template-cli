import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import packageJson from '../../../../package.json';

@Injectable({ providedIn: 'root' })
export class VersionService {
  /**
   * Returns the app version declared in package.json at build time.
   * @returns {string} The current app version.
   */
  getVersion(): string {
    return packageJson.version;
  }

  /**
   * Prints a single-line banner (project name, environment, version and load time) to the
   * browser console.
   */
  logBannerVersion(): void {
    const envName = environment.envName.toUpperCase();
    const loadedAt = new Date().toLocaleTimeString();

    console.log(
      `%ccoto-angular-template%c  %c ${envName} %c· ${this.getVersion()} %c  loaded ${loadedAt} `,
      'background:#1a1a1a;color:#fff;font-weight:800;font-size:13px;padding:6px 10px;border-radius:4px;',
      '',
      'background:#1a1a1a;color:#4ade80;font-weight:800;font-size:13px;padding:6px 0 6px 10px;border-radius:4px 0 0 4px;',
      'background:#1a1a1a;color:#ccc;font-weight:400;font-size:13px;padding:6px 10px 6px 0;border-radius:0 4px 4px 0;',
      'color:#888;font-size:13px;font-weight:400;',
    );
  }
}
