import { decodeToken } from './decode-token';

function encode(value: unknown): string {
  return btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

describe('decodeToken', () => {
  it('reads the claims of an unsigned JWT-shaped token', () => {
    const claims = { sub: 'demo-user', name: 'Usuario demo', roles: ['admin'], exp: 123 };

    expect(decodeToken(`${encode({ alg: 'none' })}.${encode(claims)}.`)).toEqual(claims);
  });

  it.each(['', 'abc', 'a.b.c', `h.${encode({ name: 'x' })}.`, `h.${encode('text')}.`])(
    'returns null for the malformed token %j',
    (token) => {
      expect(decodeToken(token)).toBeNull();
    },
  );
});
