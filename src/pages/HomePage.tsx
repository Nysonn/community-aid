import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";
import { getAllRequests } from "../api/requests";
import { useAuth } from "../hooks/useAuth";
import { useRequests } from "../hooks/useRequests";
import { saveRequestsToCache, getCachedRequests } from "../offline/db";
import RequestCard from "../components/requests/RequestCard";
import CreateRequestModal from "../components/requests/CreateRequestModal";
import type { EmergencyRequest } from "../types";

// Fix Leaflet default icon in Vite
delete ((L.Icon.Default.prototype as unknown) as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIconUrl, shadowUrl: markerShadowUrl });

const UGANDA_CENTER: [number, number] = [1.3733, 32.2903];
const TYPES = ["", "medical", "food", "rescue", "shelter"] as const;
const STATUSES = ["", "pending", "approved", "rejected", "closed"] as const;

const Spinner = () => (
  <div className="flex justify-center items-center py-24">
    <div className="h-9 w-9 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

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

  // ── Map: approved requests with coordinates ──────────────────────────────
  const { data: mapRequests = [] } = useQuery<EmergencyRequest[]>({
    queryKey: ["map-requests"],
    queryFn: () => getAllRequests({ status: "approved" }),
    staleTime: 60_000,
  });
  const mappableRequests = mapRequests.filter(
    (r) => r.latitude != null && r.longitude != null
  );

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
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20">
          <div className="flex flex-col items-center text-center">

            {/* 1. Live badge pill */}
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-4 sm:mb-5"
              style={{ background: "#EFF6FF", border: "1px solid #bfdbfe" }}
            >
              <span
                aria-hidden="true"
                style={{ width: "6px", height: "6px", borderRadius: "999px", background: "#22c55e", flexShrink: 0 }}
              />
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#185FA5", letterSpacing: "0.01em" }}>
                Live Emergency Response Platform
              </span>
            </div>

            {/* 2. Headline */}
            <h1
              className="font-extrabold text-center mb-3 sm:mb-4 w-full"
              style={{
                fontSize: "clamp(30px, 5vw, 56px)",
                letterSpacing: "-1.5px",
                lineHeight: 1.12,
                color: "#0f172a",
                maxWidth: "820px",
              }}
            >
              Emergency Response for{" "}
              <span style={{ color: "#185FA5" }}>Ugandan</span>{" "}
              Communities
            </h1>

            {/* 3. Subtext */}
            <p
              className="text-center mb-6 sm:mb-7 max-w-[340px] sm:max-w-[440px]"
              style={{
                fontSize: "14px",
                color: "#64748b",
                lineHeight: 1.65,
              }}
            >
              Connecting people in need with volunteers, donors, and responders
              — even when connectivity is limited.
            </p>

            {/* 4. CTA buttons */}
            <div className="flex flex-row flex-wrap justify-center gap-2.5 mb-3">
              <a
                href="#requests"
                className="inline-flex items-center justify-center transition-opacity duration-150 hover:opacity-85 active:scale-95"
                style={{
                  background: "#185FA5",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "14px",
                  padding: "11px 26px",
                  borderRadius: "999px",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                View Requests
              </a>

              {isCommunityMember && (
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center justify-center transition-colors duration-150 hover:bg-slate-50 active:scale-95"
                  style={{
                    background: "#ffffff",
                    color: "#0f172a",
                    fontWeight: 600,
                    fontSize: "14px",
                    padding: "11px 26px",
                    borderRadius: "999px",
                    border: "1px solid #cbd5e1",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Post a Request
                </button>
              )}

              {!isSignedIn && (
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center transition-colors duration-150 hover:bg-slate-50 active:scale-95"
                  style={{
                    background: "#ffffff",
                    color: "#0f172a",
                    fontWeight: 600,
                    fontSize: "14px",
                    padding: "11px 26px",
                    borderRadius: "999px",
                    border: "1px solid #cbd5e1",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  Join Community
                </Link>
              )}
            </div>

            {/* 5. Note text */}
            <p style={{ fontSize: "11px", color: "#94a3b8" }}>
              No account needed to browse requests
            </p>

          </div>
        </div>
      </section>

      {/* ── Requests ───────────────────────────────────────────────────────── */}
      <section id="requests" className="bg-white border-t border-gray-100">
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
