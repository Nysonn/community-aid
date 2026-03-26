import { useEffect } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import { setUser, clearUser, setLoading } from "../store/slices/authSlice";
import apiClient from "../api/client";
import { tokenStore } from "../api/tokenStore";

export function useAuth() {
  const { isSignedIn, isLoaded, getToken } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);

  console.log(
    "useAuth: Clerk isLoaded=" + isLoaded + " isSignedIn=" + isSignedIn
  );

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && !user) {
      dispatch(setLoading(true));

      getToken()
        .then(async (token) => {
          if (!token) {
            // Token not ready yet — Clerk is still propagating the session.
            // The effect will re-run once the auth state settles.
            console.log("useAuth: token not ready, skipping fetch");
            dispatch(setLoading(false));
            return;
          }

          // Keep the token store current so the Axios interceptor can attach it.
          tokenStore.token = token;
          console.log("useAuth: fetching user from backend");

          try {
            const response = await apiClient.get("/users/me", {
              // Non-standard axios config metadata, consumed by the response
              // interceptor to avoid redirecting during initial auth bootstrap.
              skipAuthRedirect: true,
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            console.log("useAuth: user fetched successfully", response.data.data);
            dispatch(setUser(response.data.data));
          } catch (err: unknown) {
            console.error("useAuth: error fetching user", err);

            // On any /me failure, attempt auto-registration. This handles:
            // - "user is not registered" (401/403 from backend auth middleware)
            // - 404 (user in Clerk but no backend row)
            // - Google OAuth sign-ups where /auth/register was never called
            if (clerkUser) {
              console.log("useAuth: attempting auto-registration");
              try {
                await apiClient.post(
                  "/auth/register",
                  {
                    clerk_id: clerkUser.id,
                    full_name:
                      clerkUser.fullName ||
                      [clerkUser.firstName, clerkUser.lastName]
                        .filter(Boolean)
                        .join(" ") ||
                      "User",
                    email:
                      clerkUser.primaryEmailAddress?.emailAddress ?? "",
                    phone_number: "",
                    profile_image_url: clerkUser.imageUrl || null,
                  },
                  {
                    skipAuthRedirect: true,
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );

                // Retry fetching the full profile from our backend.
                const retryResponse = await apiClient.get("/users/me", {
                  skipAuthRedirect: true,
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });
                console.log(
                  "useAuth: user registered and fetched successfully",
                  retryResponse.data.data
                );
                dispatch(setUser(retryResponse.data.data));
              } catch (registerErr) {
                console.error("useAuth: registration failed:", registerErr);
                dispatch(clearUser());
              }
            }
          } finally {
            dispatch(setLoading(false));
          }
        })
        .catch((err) => {
          console.error("useAuth: getToken() failed", err);
          dispatch(setLoading(false));
        });
    } else if (!isSignedIn) {
      tokenStore.token = "";
      dispatch(clearUser());
    }
  }, [isSignedIn, isLoaded, user]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isSignedIn: isSignedIn ?? false,
    isLoaded,
    user,
    clerkUser,
    role: user?.role ?? null,
    isAdmin: user?.role === "admin",
  };
}
