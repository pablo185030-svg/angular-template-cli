import { TestBed } from '@angular/core/testing';
import { environment } from '@env/environment';
import { VersionService } from './version.service';

describe('VersionService', () => {
  let service: VersionService;

  beforeEach(() => {
    service = TestBed.inject(VersionService);
  });

  it('returns a semver-like version string', () => {
    expect(service.getVersion()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('logs one banner with the project name, environment and version', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    service.logBannerVersion();

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const [message] = consoleSpy.mock.calls[0];
    expect(message).toContain('coto-angular-template');
    expect(message).toContain(environment.envName.toUpperCase());
    expect(message).toContain(service.getVersion());
    consoleSpy.mockRestore();
  });
});
