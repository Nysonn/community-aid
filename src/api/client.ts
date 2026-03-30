import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { store } from "../store";
import { clearUser } from "../store/slices/authSlice";
import { tokenStore } from "./tokenStore";

type AuthAwareRequestConfig = {
  skipAuthRedirect?: boolean;
};

function extractErrorMessage(error: unknown): string {
  const responseData = (error as {
    response?: {
      data?: {
        message?: string;
        error?: string;
        errors?: Array<{ message?: string }> | string[];
      };
    };
    message?: string;
  }).response?.data;

  if (Array.isArray(responseData?.errors) && responseData.errors.length > 0) {
    const joinedMessages = responseData.errors
      .map((entry) =>
        typeof entry === "string" ? entry : entry.message || ""
      )
      .filter(Boolean)
      .join(" ");

    if (joinedMessages) {
      return joinedMessages;
    }
  }

  return (
    responseData?.message ||
    responseData?.error ||
    (error as { message?: string }).message ||
    "An unexpected error occurred"
  );
}

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
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // Prefer calling Clerk's getToken() directly — it maintains its own cache
  // and transparently refreshes short-lived JWTs before they expire, which
  // prevents 401s caused by sending a stale token stored in tokenStore.token.
  if (tokenStore.getToken) {
    const freshToken = await tokenStore.getToken();
    if (freshToken) {
      tokenStore.token = freshToken; // keep the fallback in sync
      config.headers.Authorization = `Bearer ${freshToken}`;
    }
  } else if (tokenStore.token) {
    config.headers.Authorization = `Bearer ${tokenStore.token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
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
    const message = extractErrorMessage(error);

    const enrichedError = Object.assign(new Error(message), { status });
    return Promise.reject(enrichedError);
  }
);

export default apiClient;
