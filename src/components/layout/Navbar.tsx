import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

  const authLinks = isSignedIn ? (
    <>
      {user?.role === "community_member" && (
        <Link to="/profile" onClick={closeMenu} className="nav-link">
          Profile
        </Link>
      )}
      {user?.role === "admin" && (
        <Link to="/admin" onClick={closeMenu} className="nav-link">
          Admin Dashboard
        </Link>
      )}
      <button
        onClick={handleSignOut}
        className="nav-link text-left w-full md:w-auto"
      >
        Sign Out
      </button>
    </>
  ) : (
    <>
      <Link to="/login" onClick={closeMenu} className="nav-link">
        Login
      </Link>
      <Link
        to="/register"
        onClick={closeMenu}
        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Register
      </Link>
    </>
  );

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand with pending-actions badge */}
          <Link
            to="/"
            className="flex items-center gap-2 text-blue-600 font-bold text-lg tracking-tight"
          >
            CommunityAid
            {pendingCount > 0 && (
              <span
                title={`${pendingCount} action${pendingCount !== 1 ? "s" : ""} pending sync`}
                className="bg-amber-400 text-amber-900 text-xs font-bold px-1.5 py-0.5 rounded-full leading-none"
              >
                {pendingCount}
              </span>
            )}
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {authLinks}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3 flex flex-col gap-3">
          {authLinks}
        </div>
      )}

      <style>{`
        .nav-link {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          transition: color 0.15s;
        }
        .nav-link:hover {
          color: #2563eb;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
