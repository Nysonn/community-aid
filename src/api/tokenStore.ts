/**
 * Simple mutable store that holds the current Clerk session token.
 *
 * This lets the Axios request interceptor read the token synchronously
 * without needing to call React hooks or import Clerk inside non-React code.
 *
 * src/hooks/useAuth.ts is responsible for keeping this up-to-date whenever
 * it retrieves a fresh token from Clerk.
 */
export const tokenStore = { token: "" };
