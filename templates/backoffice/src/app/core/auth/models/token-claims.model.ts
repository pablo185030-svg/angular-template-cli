/** Claims of the fake demo token issued by the mock API. */
export interface TokenClaims {
  sub: string;
  name: string;
  roles: string[];
  /** Expiry, in seconds since the epoch. */
  exp: number;
}
