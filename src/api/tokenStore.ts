/**
 * Mutable store shared between useAuth.ts and the Axios interceptor.
 *
 * - `token`    : the most-recently-fetched Clerk JWT (fallback only)
 * - `getToken` : reference to Clerk's getToken() — set once by useAuth.
 *                The interceptor calls this on every request so Clerk's
 *                built-in cache/refresh logic always provides a fresh JWT.
 *                Without this, short-lived Clerk tokens (~60 s) expire while
 *                the user is on the page, causing spurious 401 redirects.
 */
export const tokenStore: {
  token: string;
  getToken: (() => Promise<string | null>) | null;
} = { token: "", getToken: null };
