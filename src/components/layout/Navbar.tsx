import { useState, useEffect, useCallback } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";

const SECTIONS = [
  {
    id: "about",
    label: "About",
    icon: (
      <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: "how-it-works",
    label: "How It Works",
    icon: (
      <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: "aid-types",
    label: "Aid Types",
    icon: (
      <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    id: "requests",
    label: "Requests",
    icon: (
      <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    id: "get-involved",
    label: "Get Involved",
    icon: (
      <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
] as const;

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isSignedIn, signOut } = useClerkAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const user = useSelector((state: RootState) => state.auth.user);
  const pendingCount = useSelector((state: RootState) => state.offline.pendingActions.length);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  const handleSectionClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
      e.preventDefault();
      closeMenu();
      if (isHome) {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
      } else {
        navigate("/");
        setTimeout(() => {
          document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
        }, 320);
      }
    },
    [isHome, navigate]
  );

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  // Desktop page nav link style (Map, Admin, Profile)
  const desktopPageLink = ({ isActive }: { isActive: boolean }) =>
    `text-[13px] font-medium px-3 py-1.5 rounded-lg transition-colors duration-200 ${
      isActive
        ? "text-[#185FA5] bg-blue-50 font-semibold"
        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/80"
    }`;

  // Mobile nav link style
  const mobileNavLink = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors duration-150 ${
      isActive
        ? "text-[#185FA5] bg-blue-50/80 font-semibold"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
    }`;

  return (
    <header className="sticky top-0 z-40">
      {/* ── Main bar ── */}
      <nav
        className="transition-all duration-500"
        style={{
          background: scrolled ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: scrolled
            ? "1px solid rgba(203,213,225,0.8)"
            : "1px solid rgba(226,232,240,0.5)",
          boxShadow: scrolled
            ? "0 1px 0 rgba(0,0,0,0.03), 0 4px 24px -6px rgba(0,0,0,0.07)"
            : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[68px] gap-4">

            {/* ── Brand ── */}
            <Link
              to="/"
              onClick={closeMenu}
              className="flex items-center gap-2.5 shrink-0 group"
            >
              <div
                className="relative flex items-center justify-center h-9 w-9 rounded-xl transition-transform duration-200 group-hover:scale-105"
                style={{ background: "rgba(24,95,165,0.06)" }}
              >
                <img
                  src="/logo.png"
                  alt="CommunityAid"
                  className="h-7 w-7 object-contain drop-shadow-sm"
                />
              </div>
              <span className="select-none flex items-baseline gap-[3px]">
                <span
                  style={{
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    fontWeight: 500,
                    fontSize: "17px",
                    letterSpacing: "-0.3px",
                    color: "#1e293b",
                  }}
                >
                  Community
                </span>
                <span
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontWeight: 700,
                    fontSize: "19px",
                    letterSpacing: "-0.3px",
                    color: "#185FA5",
                  }}
                >
                  Aid
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    width: "4.5px",
                    height: "4.5px",
                    borderRadius: "999px",
                    background: "#185FA5",
                    alignSelf: "flex-start",
                    marginTop: "5px",
                    marginLeft: "1px",
                    flexShrink: 0,
                    opacity: 0.85,
                  }}
                />
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

            {/* ── Desktop centre: section links + divider + page links ── */}
            <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={(e) => handleSectionClick(e, s.id)}
                  className="relative text-[13px] font-medium px-3 py-2 text-slate-500 hover:text-[#185FA5] transition-colors duration-200 group rounded-lg hover:bg-blue-50/50"
                >
                  {s.label}
                  {/* animated underline */}
                  <span
                    className="absolute bottom-1 left-3 right-3 h-[1.5px] rounded-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-200"
                    style={{ background: "#185FA5" }}
                  />
                </a>
              ))}

              {/* Separator dot */}
              <span
                className="mx-2 h-1 w-1 rounded-full shrink-0"
                style={{ background: "rgba(148,163,184,0.7)" }}
              />

              <NavLink to="/map" className={desktopPageLink}>Map</NavLink>

              {isSignedIn && user?.role === "admin" && (
                <NavLink to="/admin" className={desktopPageLink}>Admin</NavLink>
              )}
            </div>

            {/* ── Desktop right: profile + auth ── */}
            <div className="hidden lg:flex items-center gap-1.5 shrink-0">
              {isSignedIn ? (
                <>
                  {user?.role === "community_member" && (
                    <NavLink to="/profile" className={desktopPageLink}>Profile</NavLink>
                  )}

                  <div
                    className="h-[20px] w-px mx-1"
                    style={{ background: "rgba(203,213,225,0.8)" }}
                  />

                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-lg transition-colors duration-200 text-slate-400 hover:text-red-500 hover:bg-red-50/70"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>

                  {/* Avatar */}
                  <div
                    title={user?.full_name ?? "Account"}
                    className="ml-1 h-[34px] w-[34px] rounded-full flex items-center justify-center text-white text-xs font-bold select-none cursor-default transition-transform duration-150 hover:scale-105"
                    style={{
                      background: "linear-gradient(135deg, #3b82f6 0%, #185FA5 100%)",
                      boxShadow: "0 0 0 2px #fff, 0 0 0 4px rgba(24,95,165,0.2)",
                    }}
                  >
                    {initials}
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-[13px] font-medium px-3.5 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors duration-200"
                  >
                    Log in
                  </Link>

                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 text-[13px] font-semibold px-5 py-[9px] rounded-full text-white transition-all duration-200 active:scale-[0.97]"
                    style={{
                      background: "linear-gradient(135deg, #185FA5 0%, #2563eb 100%)",
                      boxShadow: "0 2px 14px rgba(24,95,165,0.38), inset 0 1px 0 rgba(255,255,255,0.12)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                        "0 4px 20px rgba(24,95,165,0.45), inset 0 1px 0 rgba(255,255,255,0.12)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                        "0 2px 14px rgba(24,95,165,0.38), inset 0 1px 0 rgba(255,255,255,0.12)";
                    }}
                  >
                    Get Started
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </>
              )}
            </div>

            {/* ── Tablet (md, not lg): compact right side ── */}
            <div className="hidden md:flex lg:hidden items-center gap-2 shrink-0">
              <NavLink to="/map" className={desktopPageLink}>Map</NavLink>
              {isSignedIn && user?.role === "admin" && (
                <NavLink to="/admin" className={desktopPageLink}>Admin</NavLink>
              )}
              {isSignedIn ? (
                <>
                  <div className="h-5 w-px bg-slate-200 mx-0.5" />
                  <button
                    onClick={handleSignOut}
                    className="text-[13px] font-medium px-3 py-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50/70 transition-colors duration-200"
                  >
                    Sign Out
                  </button>
                  <div
                    title={user?.full_name ?? "Account"}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold select-none"
                    style={{
                      background: "linear-gradient(135deg, #3b82f6 0%, #185FA5 100%)",
                      boxShadow: "0 0 0 2px #fff, 0 0 0 3.5px rgba(24,95,165,0.2)",
                    }}
                  >
                    {initials}
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-[13px] font-medium px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors duration-200"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="text-[13px] font-semibold px-4 py-[9px] rounded-full text-white transition-all duration-200 active:scale-[0.97]"
                    style={{
                      background: "linear-gradient(135deg, #185FA5 0%, #2563eb 100%)",
                      boxShadow: "0 2px 12px rgba(24,95,165,0.35)",
                    }}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* ── Mobile: avatar + animated hamburger ── */}
            <div className="md:hidden flex items-center gap-2.5">
              {isSignedIn && (
                <div
                  title={user?.full_name ?? "Account"}
                  className="h-7 w-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold select-none shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #3b82f6 0%, #185FA5 100%)",
                    boxShadow: "0 0 0 2px #fff, 0 0 0 3px rgba(24,95,165,0.25)",
                  }}
                >
                  {initials}
                </div>
              )}

              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label="Toggle menu"
                aria-expanded={menuOpen}
                className="relative flex items-center justify-center h-9 w-9 rounded-xl transition-colors duration-200 hover:bg-slate-100"
                style={{ border: "1px solid rgba(203,213,225,0.8)" }}
              >
                {/* Animated hamburger → X */}
                <span className="flex flex-col justify-between h-[13px] w-[17px]">
                  <span
                    className="block h-[1.75px] w-full rounded-full transition-all duration-300 origin-center"
                    style={{
                      background: "#475569",
                      transform: menuOpen ? "translateY(5.5px) rotate(45deg)" : "none",
                    }}
                  />
                  <span
                    className="block h-[1.75px] rounded-full transition-all duration-300"
                    style={{
                      background: "#475569",
                      width: menuOpen ? "0%" : "75%",
                      marginLeft: "auto",
                      opacity: menuOpen ? 0 : 1,
                    }}
                  />
                  <span
                    className="block h-[1.75px] w-full rounded-full transition-all duration-300 origin-center"
                    style={{
                      background: "#475569",
                      transform: menuOpen ? "translateY(-5.5px) rotate(-45deg)" : "none",
                    }}
                  />
                </span>
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* ── Mobile menu: smooth slide-down ── */}
      <div
        className="md:hidden overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: menuOpen ? "600px" : "0px",
          opacity: menuOpen ? 1 : 0,
          background: "rgba(255,255,255,0.99)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: menuOpen ? "1px solid rgba(203,213,225,0.7)" : "none",
          boxShadow: menuOpen ? "0 8px 32px -8px rgba(0,0,0,0.1)" : "none",
        }}
      >
        <div className="px-4 pt-3 pb-6 flex flex-col gap-0.5">

          {/* ── Section links ── */}
          <p
            className="text-[10px] font-bold uppercase tracking-widest px-3 mb-2 mt-1"
            style={{ color: "rgba(148,163,184,0.9)" }}
          >
            Page Sections
          </p>

          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={(e) => handleSectionClick(e, s.id)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-slate-600 hover:text-[#185FA5] hover:bg-blue-50/80 transition-colors duration-150"
            >
              <span
                className="flex items-center justify-center h-7 w-7 rounded-lg shrink-0"
                style={{ background: "rgba(24,95,165,0.07)", color: "#185FA5" }}
              >
                {s.icon}
              </span>
              {s.label}
            </a>
          ))}

          {/* ── Divider ── */}
          <div
            className="my-3 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(203,213,225,0.8), transparent)" }}
          />

          {/* ── Page links ── */}
          <p
            className="text-[10px] font-bold uppercase tracking-widest px-3 mb-2"
            style={{ color: "rgba(148,163,184,0.9)" }}
          >
            Pages
          </p>

          <NavLink to="/map" className={mobileNavLink} onClick={closeMenu}>
            <span
              className="flex items-center justify-center h-7 w-7 rounded-lg shrink-0"
              style={{ background: "rgba(100,116,139,0.08)", color: "#64748b" }}
            >
              <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </span>
            Map
          </NavLink>

          {isSignedIn && user?.role === "admin" && (
            <NavLink to="/admin" className={mobileNavLink} onClick={closeMenu}>
              <span
                className="flex items-center justify-center h-7 w-7 rounded-lg shrink-0"
                style={{ background: "rgba(100,116,139,0.08)", color: "#64748b" }}
              >
                <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              Admin Dashboard
            </NavLink>
          )}

          {/* ── Divider ── */}
          <div
            className="my-3 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(203,213,225,0.8), transparent)" }}
          />

          {/* ── Account section ── */}
          {isSignedIn ? (
            <>
              {user?.full_name && (
                <div
                  className="flex items-center gap-3 px-3 py-3 rounded-xl mb-1"
                  style={{ background: "rgba(248,250,252,0.9)", border: "1px solid rgba(226,232,240,0.8)" }}
                >
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{
                      background: "linear-gradient(135deg, #3b82f6 0%, #185FA5 100%)",
                      boxShadow: "0 0 0 2px #fff, 0 0 0 3.5px rgba(24,95,165,0.18)",
                    }}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 leading-tight truncate">{user.full_name}</p>
                    <p className="text-xs text-slate-400 leading-tight capitalize mt-0.5">
                      {user.role?.replace("_", " ")}
                    </p>
                  </div>
                </div>
              )}

              {user?.role === "community_member" && (
                <NavLink to="/profile" className={mobileNavLink} onClick={closeMenu}>
                  <span
                    className="flex items-center justify-center h-7 w-7 rounded-lg shrink-0"
                    style={{ background: "rgba(100,116,139,0.08)", color: "#64748b" }}
                  >
                    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  Profile
                </NavLink>
              )}

              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-red-500 hover:bg-red-50 transition-colors duration-150 text-left w-full mt-1"
              >
                <span
                  className="flex items-center justify-center h-7 w-7 rounded-lg shrink-0"
                  style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}
                >
                  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </span>
                Sign Out
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-1">
              <Link
                to="/login"
                onClick={closeMenu}
                className="flex items-center justify-center px-4 py-3 rounded-xl text-[13.5px] font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-50"
                style={{ border: "1px solid rgba(203,213,225,0.9)" }}
              >
                Log in
              </Link>
              <Link
                to="/register"
                onClick={closeMenu}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13.5px] font-semibold text-white transition-all duration-200 active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #185FA5 0%, #2563eb 100%)",
                  boxShadow: "0 2px 14px rgba(24,95,165,0.35)",
                }}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Get Started — It's Free
              </Link>
            </div>
          )}

        </div>
      </div>
    </header>
  );
};

export default Navbar;
