import { Permission } from './permission.model';

/** Claims of the fake demo token issued by the mock API. */
export interface TokenClaims {
  sub: string;
  name: string;
  /** Name of the user's role. */
  role: string;
  permissions: Permission[];
  /** Expiry, in seconds since the epoch. */
  exp: number;
}
