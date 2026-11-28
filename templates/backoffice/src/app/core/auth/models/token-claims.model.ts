/** Claims of the fake demo token issued by the mock API. */
export interface TokenClaims {
  sub: string;
  name: string;
  /** Expiry, in seconds since the epoch. */
  exp: number;
}
