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
        <footer className="relative mt-auto overflow-hidden" style={{ background: "linear-gradient(160deg, #050E26 0%, #0A1C41 60%, #050E26 100%)" }}>
          {/* Dot-grid texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{ backgroundImage: "radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
            aria-hidden="true"
          />
          {/* Top glow orb */}
          <div
            className="absolute pointer-events-none"
            style={{ top: "-80px", left: "50%", transform: "translateX(-50%)", width: "600px", height: "200px", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(24,95,165,0.18) 0%, transparent 70%)", filter: "blur(40px)" }}
            aria-hidden="true"
          />

          {/* ── Top accent line ── */}
          <div className="h-[3px]" style={{ background: "linear-gradient(90deg, transparent, #185FA5 30%, #3B82F6 50%, #185FA5 70%, transparent)" }} />

          {/* ── Main footer body ── */}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">

            {/* ── 4-column grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

              {/* Col 1: Brand */}
              <div className="sm:col-span-2 lg:col-span-1 flex flex-col gap-5">
                <Link to="/" className="flex items-center gap-2 group w-fit">
                  <img
                    src="/logo.png"
                    alt="CommunityAid"
                    className="h-8 w-8 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  <span className="select-none" style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                    <span style={{ fontFamily: "system-ui, sans-serif", fontWeight: 500, fontSize: "17px", letterSpacing: "-0.5px", color: "rgba(255,255,255,0.88)" }}>Community</span>
                    <span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700, fontSize: "18px", letterSpacing: "-0.5px", color: "#60A5FA" }}>Aid</span>
                    <span aria-hidden="true" style={{ width: "5px", height: "5px", borderRadius: "999px", background: "#60A5FA", alignSelf: "flex-start", marginTop: "5px", marginLeft: "1px", flexShrink: 0 }} />
                  </span>
                </Link>

                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13.5px", lineHeight: 1.75 }}>
                  Connecting people in crisis with volunteers, donors, and emergency responders — even where internet access is limited.
                </p>

                {/* Location badge */}
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0" style={{ color: "#60A5FA" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px" }}>Based in Uganda · Serving East Africa</span>
                </div>

                {/* Social links */}
                <div className="flex items-center gap-2 mt-1">
                  {[
                    {
                      label: "Facebook",
                      icon: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z",
                    },
                    {
                      label: "Twitter / X",
                      icon: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z",
                    },
                    {
                      label: "WhatsApp",
                      icon: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z",
                    },
                  ].map((s) => (
                    <button
                      key={s.label}
                      aria-label={s.label}
                      className="h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-110"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(24,95,165,0.35)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; }}
                    >
                      <svg className="h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.55)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d={s.icon} />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Col 2: Platform */}
              <div className="flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>Platform</h3>
                <nav className="flex flex-col gap-2.5">
                  {[
                    { to: "/", label: "Home" },
                    { to: "/requests", label: "Emergency Requests" },
                    { to: "/map", label: "Aid Map" },
                    { to: "/offers", label: "Offers & Help" },
                  ].map(({ to, label }) => (
                    <Link
                      key={to}
                      to={to}
                      className="group flex items-center gap-2 w-fit transition-all duration-150"
                      style={{ color: "rgba(255,255,255,0.48)", fontSize: "13.5px" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.9)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.48)"; }}
                    >
                      <span className="h-px w-0 group-hover:w-3 bg-blue-400 transition-all duration-200 shrink-0" />
                      {label}
                    </Link>
                  ))}
                </nav>
              </div>

              {/* Col 3: Get Involved */}
              <div className="flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>Get Involved</h3>
                <nav className="flex flex-col gap-2.5">
                  {[
                    { to: "/register", label: "Join as Volunteer" },
                    { to: "/requests", label: "Donate to a Cause" },
                    { to: "/register", label: "Create an Account" },
                    { to: "/login", label: "Sign In" },
                  ].map(({ to, label }) => (
                    <Link
                      key={label}
                      to={to}
                      className="group flex items-center gap-2 w-fit transition-all duration-150"
                      style={{ color: "rgba(255,255,255,0.48)", fontSize: "13.5px" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.9)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.48)"; }}
                    >
                      <span className="h-px w-0 group-hover:w-3 bg-blue-400 transition-all duration-200 shrink-0" />
                      {label}
                    </Link>
                  ))}
                </nav>
              </div>

              {/* Col 4: Impact stats */}
              <div className="flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>Our Impact</h3>
                <div className="flex flex-col gap-4">
                  {[
                    { value: "2,400+", label: "People Helped", color: "#60A5FA" },
                    { value: "UGX 45M+", label: "Aid Mobilised", color: "#34D399" },
                    { value: "12+", label: "Districts Reached", color: "#A78BFA" },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center gap-3">
                      <div className="h-8 w-1 rounded-full shrink-0" style={{ background: stat.color, opacity: 0.7 }} />
                      <div>
                        <p className="font-extrabold leading-none" style={{ fontSize: "18px", color: stat.color }}>{stat.value}</p>
                        <p style={{ color: "rgba(255,255,255,0.38)", fontSize: "11.5px", marginTop: "2px" }}>{stat.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* ── Divider ── */}
            <div className="my-10" style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.08) 70%, transparent)" }} />

            {/* ── Bottom bar ── */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Copyright */}
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12.5px" }}>
                &copy; {new Date().getFullYear()} CommunityAid. All rights reserved.
              </p>

              {/* Policy links */}
              <div className="flex items-center gap-4">
                {["Privacy Policy", "Terms of Use"].map((label) => (
                  <button
                    key={label}
                    className="transition-colors duration-150"
                    style={{ color: "rgba(255,255,255,0.28)", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.28)"; }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </footer>
        <Toast toasts={toast.toasts} onDismiss={toast.dismissToast} />
      </div>
    </ToastContext.Provider>
  );
};

export default Layout;
