import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { useRequests } from "../hooks/useRequests";
import { saveRequestsToCache, getCachedRequests } from "../offline/db";
import RequestCard from "../components/requests/RequestCard";
import CreateRequestModal from "../components/requests/CreateRequestModal";
import type { EmergencyRequest } from "../types";

const TYPES = ["", "medical", "food", "rescue", "shelter"] as const;
const STATUSES = ["", "pending", "approved", "rejected", "closed"] as const;

const RequestCardSkeleton = () => (
  <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col shadow-card animate-pulse">
    <div className="h-[3px] w-full bg-gray-200" />
    <div className="p-5 flex flex-col gap-3 flex-1">
      <div className="flex items-center gap-2">
        <div className="h-5 w-16 bg-gray-100 rounded-full" />
        <div className="h-5 w-16 bg-gray-100 rounded-full" />
      </div>
      <div className="h-4 bg-gray-100 rounded-full w-3/4" />
      <div className="space-y-1.5">
        <div className="h-3.5 bg-gray-100 rounded-full" />
        <div className="h-3.5 bg-gray-100 rounded-full w-4/5" />
      </div>
      <div className="h-3 bg-gray-100 rounded-full w-1/2" />
      <div className="mt-auto h-8 bg-gray-100 rounded-xl" />
    </div>
  </div>
);

const HomePage = () => {
  const { isSignedIn, isAdmin, user } = useAuth();
  const queryClient = useQueryClient();

  // ── Requests section ─────────────────────────────────────────────────────
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cachedRequests, setCachedRequests] = useState<EmergencyRequest[] | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const up = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  useEffect(() => {
    if (!isOnline) {
      getCachedRequests().then(setCachedRequests).catch(() => setCachedRequests([]));
    }
  }, [isOnline]);

  const { data: apiRequests, isLoading, isError } = useRequests(
    isOnline
      ? {
          ...(typeFilter && { type: typeFilter }),
          ...(statusFilter && { status: statusFilter }),
          ...(locationFilter && { location_name: locationFilter }),
        }
      : undefined
  );

  useEffect(() => {
    if (apiRequests && apiRequests.length > 0) saveRequestsToCache(apiRequests);
  }, [apiRequests]);

  const requests = isOnline ? (apiRequests ?? []) : (cachedRequests ?? []);
  const isCached = !isOnline && cachedRequests !== null;
  const isLoading_ = isLoading && isOnline;
  const isCommunityMember = isSignedIn && user?.role !== "admin";
  const hasActiveFilters = typeFilter || statusFilter || locationFilter;

  return (
    <div>
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section
        className="relative flex items-center overflow-hidden"
        style={{ minHeight: "clamp(560px, 90vh, 860px)" }}
      >
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://res.cloudinary.com/df3lhzzy7/image/upload/v1775554557/pexels-rdne-6647115_lxnhbv.jpg')",
          }}
          aria-hidden="true"
        />

        {/* Layered overlay — deep navy tint so text pops */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, rgba(10,22,50,0.82) 0%, rgba(15,40,80,0.72) 50%, rgba(10,22,50,0.88) 100%)",
          }}
          aria-hidden="true"
        />

        {/* Bottom wave divider */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden"
          style={{ height: "88px" }}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 1440 88"
            preserveAspectRatio="none"
            style={{ width: "100%", height: "100%", display: "block" }}
          >
            <path
              d="M0,44 C360,88 1080,0 1440,44 L1440,88 L0,88 Z"
              fill="rgba(248,249,251,0.4)"
            />
            <path
              d="M0,60 C480,88 960,36 1440,60 L1440,88 L0,88 Z"
              fill="#F8F9FB"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28">
          <div className="flex flex-col items-center text-center">

            {/* 1. Live badge pill */}
            <div
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-6 sm:mb-7"
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.28)",
                backdropFilter: "blur(8px)",
              }}
            >
              {/* Pulsing green dot */}
              <span className="relative flex h-2 w-2 shrink-0">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ background: "#4ade80" }}
                />
                <span
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ background: "#22c55e" }}
                />
              </span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.92)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                Live Emergency Response Platform
              </span>
            </div>

            {/* 2. Headline */}
            <h1
              className="font-extrabold text-center mb-4 sm:mb-5 w-full"
              style={{
                fontSize: "clamp(32px, 5.5vw, 64px)",
                letterSpacing: "-1.5px",
                lineHeight: 1.1,
                color: "#ffffff",
                maxWidth: "860px",
                textShadow: "0 2px 20px rgba(0,0,0,0.3)",
              }}
            >
              Emergency Response for{" "}
              <span
                style={{
                  color: "#60a5fa",
                  position: "relative",
                  display: "inline-block",
                }}
              >
                Ugandan
              </span>{" "}
              Communities
            </h1>

            {/* 3. Subtext */}
            <p
              className="text-center mb-8 sm:mb-10 max-w-[360px] sm:max-w-[480px]"
              style={{
                fontSize: "15px",
                color: "rgba(255,255,255,0.75)",
                lineHeight: 1.7,
              }}
            >
              Connecting people in need with volunteers, donors, and responders
              — even when connectivity is limited.
            </p>

            {/* 4. CTA buttons */}
            <div className="flex flex-row flex-wrap justify-center gap-3 mb-10 sm:mb-12">
              <a
                href="#requests"
                className="inline-flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.03] active:scale-95 shadow-lg"
                style={{
                  background: "#185FA5",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "14px",
                  padding: "13px 30px",
                  borderRadius: "999px",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  boxShadow: "0 4px 20px rgba(24,95,165,0.5)",
                }}
              >
                <svg style={{ width: "16px", height: "16px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Requests
              </a>

              {isCommunityMember && (
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center justify-center gap-2 transition-all duration-200 hover:bg-white/20 active:scale-95"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "14px",
                    padding: "13px 30px",
                    borderRadius: "999px",
                    border: "1.5px solid rgba(255,255,255,0.4)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <svg style={{ width: "16px", height: "16px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Post a Request
                </button>
              )}

              {!isSignedIn && (
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 transition-all duration-200 hover:bg-white/20 active:scale-95"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "14px",
                    padding: "13px 30px",
                    borderRadius: "999px",
                    border: "1.5px solid rgba(255,255,255,0.4)",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <svg style={{ width: "16px", height: "16px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Join Community
                </Link>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ── Requests ───────────────────────────────────────────────────────── */}
      <section id="requests" className="bg-[#F8F9FB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">

          {/* ── Section header ── */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 inline-block" />
                Live Feed
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Emergency Requests
              </h2>
              <p className="text-sm text-slate-500 mt-1.5 flex items-center gap-2 flex-wrap">
                Active requests from communities across Uganda
                {!isLoading_ && requests.length > 0 && (
                  <span className="inline-flex items-center bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {requests.length} active
                  </span>
                )}
              </p>
            </div>
            {isCommunityMember && (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 shadow-md shadow-blue-200/60 hover:shadow-lg active:scale-95 shrink-0 self-start sm:self-auto"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Post a Request
              </button>
            )}
          </div>

          {/* ── Offline cache banner ── */}
          {isCached && (
            <div className="mb-5 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-xl flex items-center gap-2.5">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Showing cached data. Connect to the internet to see the latest requests.
            </div>
          )}

          {/* ── Type pill toggles ── */}
          <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 mb-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                    typeFilter === t
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white text-slate-600 border border-gray-200 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50/60 shadow-sm"
                  }`}
                >
                  {t === "" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}

              {isAdmin && (
                <>
                  <div className="hidden sm:block w-px h-5 bg-gray-200 mx-0.5 shrink-0" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3.5 py-1.5 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  >
                    <option value="">All Statuses</option>
                    {STATUSES.filter(Boolean).map((s) => (
                      <option key={s} value={s} className="capitalize">
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {hasActiveFilters && (
                <button
                  onClick={() => { setTypeFilter(""); setStatusFilter(""); setLocationFilter(""); }}
                  className="ml-auto flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-red-50"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* ── Location search ── */}
          <div className="relative mb-6">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M16.65 10a6.65 6.65 0 11-13.3 0 6.65 6.65 0 0113.3 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="Search by location…"
              className="w-full border border-gray-200 rounded-2xl pl-11 pr-4 py-3 text-sm bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
          </div>

          {/* ── Results ── */}
          {isLoading_ ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <RequestCardSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-red-50 mb-4">
                <svg className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <p className="text-slate-800 font-semibold text-base">Failed to load requests</p>
              <p className="text-slate-400 text-sm mt-1">Please check your connection and try again.</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-slate-100 mb-4">
                <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-slate-800 font-semibold text-base">No requests found</p>
              <p className="text-slate-400 text-sm mt-1">
                {hasActiveFilters
                  ? "Try clearing the filters to see more results."
                  : "There are no active emergency requests right now."}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={() => { setTypeFilter(""); setStatusFilter(""); setLocationFilter(""); }}
                  className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {requests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}

        </div>
      </section>

      <CreateRequestModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["requests"] });
          setShowModal(false);
        }}
      />
    </div>
  );
};

export default HomePage;
