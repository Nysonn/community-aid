import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useSelector } from "react-redux";
import type { RootState } from "../store";

/**
 * Landing page after a Google OAuth sign-in. Waits for the backend user
 * (and their role) to be fetched, then routes admins to /admin and
 * everyone else to /requests.
 */
const SSORedirectPage = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthLoading = useSelector((state: RootState) => state.auth.isLoading);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (isAuthLoading || !user) return;

    if (user.role === "admin") {
      navigate("/admin", { replace: true });
    } else {
      navigate("/requests", { replace: true });
    }
  }, [isLoaded, isSignedIn, isAuthLoading, user, navigate]);

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-[#F8F9FB] gap-4">
      <div className="h-9 w-9 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-slate-400 font-medium">Signing you in&hellip;</p>
    </div>
  );
};

export default SSORedirectPage;
