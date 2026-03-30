import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSignUp, useAuth } from "@clerk/clerk-react";
import apiClient from "../api/client";
import { tokenStore } from "../api/tokenStore";

interface FieldErrors {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
}

const RegisterPage = () => {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { isSignedIn, isLoaded: authIsLoaded, getToken } = useAuth();
  const navigate = useNavigate();

  // Block auto-navigation if the backend registration step failed so the
  // user can see the error and retry rather than silently landing on /requests
  // with a broken account state.
  const [registrationFailed, setRegistrationFailed] = useState(false);

  // Redirect whenever Clerk confirms the session — handles both "already signed in"
  // and "just completed registration".
  useEffect(() => {
    if (authIsLoaded && isSignedIn && !registrationFailed) {
      navigate("/requests", { replace: true });
    }
  }, [authIsLoaded, isSignedIn, navigate, registrationFailed]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const errors: FieldErrors = {};

    if (!fullName.trim()) errors.fullName = "Full name is required.";
    if (!email.trim()) errors.email = "Email is required.";
    if (!phoneNumber.trim()) errors.phoneNumber = "Phone number is required.";
    if (!password) errors.password = "Password is required.";
    else if (password.length < 8)
      errors.password = "Password must be at least 8 characters.";
    if (!confirmPassword)
      errors.confirmPassword = "Please confirm your password.";
    else if (password !== confirmPassword)
      errors.confirmPassword = "Passwords do not match.";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setServerError("");

    if (!validate()) return;

    setSubmitting(true);

    try {
      const result = await signUp.create({
        emailAddress: email,
        password,
        firstName: fullName.split(" ")[0],
        lastName: fullName.split(" ").slice(1).join(" ") || undefined,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });

        // Get a real JWT from Clerk (createdSessionId is a session ID, not a token).
        const token = await getToken();
        if (token) {
          tokenStore.token = token;
        }

        setRegistrationFailed(false);
        try {
          await apiClient.post(
            "/auth/register",
            {
              clerk_id: result.createdUserId,
              full_name: fullName,
              email,
              phone_number: phoneNumber,
              profile_image_url: null,
            },
            {
              skipAuthRedirect: true,
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            }
          );
          // Do not call navigate() here. The useEffect above navigates once
          // Clerk has fully updated isSignedIn to true.
        } catch (registerErr: unknown) {
          const regError = registerErr as { message?: string };
          setRegistrationFailed(true);
          setServerError(
            regError.message ?? "Account created but registration failed. Please try again."
          );
        }
      } else {
        setServerError("Registration could not be completed. Please try again.");
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] };
      setServerError(
        clerkError.errors?.[0]?.message ??
          "Registration failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignUp = () => {
    if (!isLoaded) return;
    signUp.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: "/sso-callback",
      redirectUrlComplete: "/requests",
    });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-blue-50/50 via-white to-slate-50">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-card-hover w-full max-w-md p-8 sm:p-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Join CommunityAid
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">Create your account and start making a difference</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-semibold text-slate-700 mb-1.5"
            >
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white shadow-sm"
              placeholder="Jane Doe"
            />
            {fieldErrors.fullName && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1"><svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{fieldErrors.fullName}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-slate-700 mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white shadow-sm"
              placeholder="you@example.com"
            />
            {fieldErrors.email && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1"><svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="phoneNumber"
              className="block text-sm font-semibold text-slate-700 mb-1.5"
            >
              Phone Number
            </label>
            <input
              id="phoneNumber"
              type="tel"
              autoComplete="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white shadow-sm"
              placeholder="+256 700 000000"
            />
            {fieldErrors.phoneNumber && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1"><svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{fieldErrors.phoneNumber}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-slate-700 mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white shadow-sm"
              placeholder="Min. 8 characters"
            />
            {fieldErrors.password && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1"><svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{fieldErrors.password}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-semibold text-slate-700 mb-1.5"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white shadow-sm"
              placeholder="••••••••"
            />
            {fieldErrors.confirmPassword && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1"><svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{fieldErrors.confirmPassword}</p>
            )}
          </div>

          {serverError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !isLoaded}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-full text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md mt-1"
          >
            {submitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-3 text-slate-400 text-xs font-medium">or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignUp}
          disabled={!isLoaded}
          className="w-full border border-gray-200 text-slate-700 py-2.5 px-4 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2.5 shadow-sm"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Sign up with Google
        </button>

        <p className="text-center text-sm text-slate-500 mt-7">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
