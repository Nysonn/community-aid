import { createContext, useContext } from "react";
import { Outlet, Link } from "react-router-dom";
import Navbar from "./Navbar";
import OfflineBanner from "../common/OfflineBanner";
import Toast from "../common/Toast";
import { useOfflineSync } from "../../hooks/useOfflineSync";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../hooks/useAuth";

type ToastAPI = ReturnType<typeof useToast>;

export const ToastContext = createContext<ToastAPI | null>(null);

export function useGlobalToast(): ToastAPI {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useGlobalToast must be used within Layout");
  return ctx;
}

const Layout = () => {
  useAuth(); // Bootstrap user + role into Redux for all pages
  useOfflineSync();
  const toast = useToast();

  return (
    <ToastContext.Provider value={toast}>
      <div className="min-h-screen flex flex-col bg-[#F8F9FB]">
        <OfflineBanner />
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <footer className="bg-white border-t border-gray-100 mt-auto">
          {/* Gradient accent line — mirrors the one below the navbar */}
          <div className="h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Top row: brand + nav links */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5">

              {/* Wordmark — mirrors Navbar */}
              <Link to="/" className="flex items-center gap-2 shrink-0 group">
                <img
                  src="/logo.png"
                  alt="CommunityAid"
                  className="h-7 w-7 object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                />
                <span className="select-none" style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                  <span style={{ fontFamily: "system-ui, sans-serif", fontWeight: 500, fontSize: "17px", letterSpacing: "-0.5px" }}>Community</span>
                  <span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700, fontSize: "18px", letterSpacing: "-0.5px", color: "#185FA5" }}>Aid</span>
                  <span aria-hidden="true" style={{ width: "5px", height: "5px", borderRadius: "999px", background: "#185FA5", alignSelf: "flex-start", marginTop: "5px", marginLeft: "1px", flexShrink: 0 }} />
                </span>
              </Link>

              {/* Nav links */}
              <nav className="flex items-center gap-1">
                {[
                  { to: "/requests", label: "Requests" },
                  { to: "/map", label: "Map" },
                  { to: "/login", label: "Sign In" },
                ].map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className="text-sm text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100/70 transition-all duration-150"
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-100 my-6" />

            {/* Bottom row: copyright + tagline */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
              <p>&copy; {new Date().getFullYear()} CommunityAid. All rights reserved.</p>
              <p className="text-center sm:text-right">
                Empowering Ugandan communities through coordinated emergency response.
              </p>
            </div>
          </div>
        </footer>
        <Toast toasts={toast.toasts} onDismiss={toast.dismissToast} />
      </div>
    </ToastContext.Provider>
  );
};

export default Layout;
