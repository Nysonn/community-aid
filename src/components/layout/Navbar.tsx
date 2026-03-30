import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isSignedIn, signOut } = useClerkAuth();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const pendingCount = useSelector(
    (state: RootState) => state.offline.pendingActions.length
  );

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  // Desktop nav link — active page gets a blue pill
  const desktopLink = ({ isActive }: { isActive: boolean }) =>
    `relative text-sm font-medium px-3.5 py-1.5 rounded-lg transition-all duration-200 ${
      isActive
        ? "text-blue-600 bg-blue-50/80 font-semibold"
        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/70"
    }`;

  // Mobile nav link
  const mobileLink = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
      isActive
        ? "text-blue-600 bg-blue-50 font-semibold"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
    }`;

  // User initials for avatar
  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-40">
      {/* ── Main bar ── */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[64px] gap-6">

            {/* ── Brand ── */}
            <Link
              to="/"
              onClick={closeMenu}
              className="flex items-center gap-2.5 shrink-0 group"
            >
              <img
                src="/logo.png"
                alt="CommunityAid"
                className="h-9 w-9 object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
              />
              <span className="select-none" style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                <span style={{ fontFamily: "system-ui, sans-serif", fontWeight: 500, fontSize: "20px", letterSpacing: "-0.5px" }}>Community</span>
                <span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700, fontSize: "22px", letterSpacing: "-0.5px", color: "#185FA5" }}>Aid</span>
                <span aria-hidden="true" style={{ width: "6px", height: "6px", borderRadius: "999px", background: "#185FA5", alignSelf: "flex-start", marginTop: "6px", marginLeft: "1px", flexShrink: 0 }} />
              </span>
              {pendingCount > 0 && (
                <span
                  title={`${pendingCount} action${pendingCount !== 1 ? "s" : ""} pending sync`}
                  className="bg-amber-400 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none tabular-nums"
                >
                  {pendingCount}
                </span>
              )}
            </Link>

            {/* ── Desktop centre nav ── */}
            <div className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
              <NavLink to="/requests" className={desktopLink}>Requests</NavLink>
              <NavLink to="/map" className={desktopLink}>Map</NavLink>
              {isSignedIn && user?.role === "admin" && (
                <NavLink to="/admin" className={desktopLink}>Admin</NavLink>
              )}
            </div>

            {/* ── Desktop right controls ── */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              {isSignedIn ? (
                <>
                  {user?.role === "community_member" && (
                    <NavLink to="/profile" className={desktopLink}>
                      Profile
                    </NavLink>
                  )}

                  {/* Thin separator */}
                  <div className="w-px h-5 bg-slate-200 mx-1" />

                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50/70 transition-all duration-150"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>

                  {/* Avatar */}
                  <div
                    title={user?.full_name ?? "Account"}
                    className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shadow-md ring-2 ring-blue-100 ring-offset-1 select-none cursor-default transition-transform duration-150 hover:scale-105"
                  >
                    {initials}
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3.5 py-1.5 rounded-lg hover:bg-slate-100/70 transition-all duration-150"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 shadow-md shadow-blue-200/60 hover:shadow-blue-300/60 hover:shadow-lg active:scale-95"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* ── Mobile right: avatar + hamburger ── */}
            <div className="md:hidden flex items-center gap-2">
              {isSignedIn && (
                <div
                  title={user?.full_name ?? "Account"}
                  className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-[11px] font-bold shadow-sm ring-2 ring-blue-100 select-none"
                >
                  {initials}
                </div>
              )}
              <button
                className="flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 transition-all duration-150 shadow-sm"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label="Toggle menu"
                aria-expanded={menuOpen}
              >
                <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
                {menuOpen ? (
                  /* Close — refined × */
                  <svg className="h-3.5 w-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  /* Open — three lines, middle shorter for premium feel */
                  <svg className="h-3.5 w-3.5 text-slate-600" fill="none" viewBox="0 0 16 12" stroke="currentColor">
                    <line x1="0" y1="1"  x2="16" y2="1"  strokeWidth="1.75" strokeLinecap="round" />
                    <line x1="2" y1="6"  x2="14" y2="6"  strokeWidth="1.75" strokeLinecap="round" />
                    <line x1="0" y1="11" x2="16" y2="11" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* ── Gradient accent line below nav ── */}
      <div className="h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />

      {/* ── Mobile dropdown ── */}
      {menuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-slate-200/60 shadow-lg px-4 pt-3 pb-5 flex flex-col gap-1">

          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest px-3.5 mb-1">
            Navigate
          </p>

          <NavLink to="/requests" className={mobileLink} onClick={closeMenu}>
            <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Requests
          </NavLink>

          <NavLink to="/map" className={mobileLink} onClick={closeMenu}>
            <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Map
          </NavLink>

          {isSignedIn && user?.role === "admin" && (
            <NavLink to="/admin" className={mobileLink} onClick={closeMenu}>
              <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Admin Dashboard
            </NavLink>
          )}

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-2" />

          {/* Account section */}
          {isSignedIn ? (
            <>
              {user?.full_name && (
                <div className="flex items-center gap-3 px-3.5 py-2 mb-1">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shadow-sm ring-2 ring-blue-100 shrink-0">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 leading-tight">{user.full_name}</p>
                    <p className="text-xs text-slate-400 leading-tight capitalize">{user.role?.replace("_", " ")}</p>
                  </div>
                </div>
              )}

              {user?.role === "community_member" && (
                <NavLink to="/profile" className={mobileLink} onClick={closeMenu}>
                  <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </NavLink>
              )}

              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all duration-150 text-left w-full mt-1"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-1">
              <Link
                to="/login"
                onClick={closeMenu}
                className="flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 border border-slate-200 hover:border-blue-200 hover:bg-blue-50/60 hover:text-blue-700 transition-all duration-200"
              >
                Log in
              </Link>
              <Link
                to="/register"
                onClick={closeMenu}
                className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2.5 rounded-full text-sm font-semibold hover:from-blue-700 hover:to-blue-600 transition-all duration-200 shadow-md shadow-blue-200/50"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
