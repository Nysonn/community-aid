import axios from "axios";
import { store } from "../store";
import { clearUser } from "../store/slices/authSlice";
import { tokenStore } from "./tokenStore";

type AuthAwareRequestConfig = {
  skipAuthRedirect?: boolean;
};

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

/**
 * Request interceptor — attaches the Clerk Bearer token from the token store.
 *
 * The previous implementation tried `await import("@clerk/clerk-react")` and
 * read `Clerk.session?.getToken()`. That imports the *package object*, not the
 * Clerk singleton, so `Clerk.session` was always undefined and the token was
 * never attached. Reading from `tokenStore.token` (kept current by useAuth.ts)
 * is synchronous and reliable.
 */
apiClient.interceptors.request.use((config) => {
  if (tokenStore.token) {
    config.headers.Authorization = `Bearer ${tokenStore.token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401 || status === 403) {
      // Requests can opt out of the redirect (e.g. the initial profile fetch in
      // useAuth, which runs right after login before the token propagates fully).
      const skipRedirect = (error.config as AuthAwareRequestConfig | undefined)
        ?.skipAuthRedirect;
      if (!skipRedirect) {
        store.dispatch(clearUser());
        window.location.href = "/login";
      }
    }

    // Extract a human-readable message and preserve the HTTP status on the
    // thrown error so callers can branch on it (e.g. 404 → auto-register).
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "An unexpected error occurred";

    const enrichedError = Object.assign(new Error(message), { status });
    return Promise.reject(enrichedError);
  }
);

export default apiClient;
