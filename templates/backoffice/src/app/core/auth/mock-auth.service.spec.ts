import { MockAuthService } from './mock-auth.service';

describe('MockAuthService', () => {
  it('runs in demo mode with a signed-in demo user and a token', () => {
    const service = new MockAuthService();

    expect(service.isDemo).toBe(true);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.userName()).toBe('Usuario demo');
    expect(service.getAccessToken()).toBe('mock-token');
  });

  it('keeps the demo user signed in after logout, since there is no session to end', () => {
    const service = new MockAuthService();

    service.logout();

    expect(service.isAuthenticated()).toBe(true);
  });
});
