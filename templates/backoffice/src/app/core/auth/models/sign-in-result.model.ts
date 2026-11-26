/** Outcome of a username and password sign-in. */
export type SignInResult = { ok: true } | { ok: false; message: string };
