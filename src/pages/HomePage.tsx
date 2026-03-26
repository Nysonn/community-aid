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
delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIconUrl, shadowUrl: markerShadowUrl });

const UGANDA_CENTER: [number, number] = [1.3733, 32.2903];
const TYPES = ["", "medical", "food", "rescue", "shelter"] as const;
const STATUSES = ["", "pending", "approved", "rejected", "closed"] as const;

const Spinner = () => (
  <div className="flex justify-center items-center py-20">
    <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

            {/* Text + CTA */}
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Coordinating Emergency Response for Ugandan Communities
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                CommunityAid connects people in need with volunteers, donors, and
                responders. Post emergency requests, offer help, and track aid in
                real time — even when connectivity is limited.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#requests"
                  className="bg-blue-600 text-white px-6 py-3 rounded-md text-base font-medium hover:bg-blue-700 transition-colors text-center"
                >
                  View Requests
                </a>
                {isCommunityMember && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="bg-white text-blue-600 border border-blue-600 px-6 py-3 rounded-md text-base font-medium hover:bg-blue-50 transition-colors"
                  >
                    Post a Request
                  </button>
                )}
                {!isSignedIn && (
                  <Link
                    to="/register"
                    className="bg-white text-blue-600 border border-blue-600 px-6 py-3 rounded-md text-base font-medium hover:bg-blue-50 transition-colors text-center"
                  >
                    Join Community
                  </Link>
                )}
              </div>
            </div>

            {/* Embedded Map */}
            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm h-[380px]">
              <MapContainer
                center={UGANDA_CENTER}
                zoom={7}
                style={{ height: "100%", width: "100%" }}
                zoomControl={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {mappableRequests.map((r) => (
                  <CircleMarker
                    key={r.id}
                    center={[r.latitude!, r.longitude!]}
                    radius={8}
                    pathOptions={{
                      color: "#b91c1c",
                      fillColor: "#ef4444",
                      fillOpacity: 0.85,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="min-w-[160px] space-y-1 text-sm">
                        <p className="font-semibold text-gray-900 leading-snug">
                          {r.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          &#128205; {r.location_name}
                        </p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>

          </div>
        </div>
      </section>

      {/* ── Requests ───────────────────────────────────────────────────────── */}
      <section id="requests" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Emergency Requests</h2>
          {isCommunityMember && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              + Post a Request
            </button>
          )}
        </div>

        {isCached && (
          <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-2.5 rounded-md">
            Showing cached data. Connect to the internet to see the latest requests.
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {TYPES.filter(Boolean).map((t) => (
              <option key={t} value={t} className="capitalize">
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>

          {isAdmin && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {STATUSES.filter(Boolean).map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          )}

          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M16.65 10a6.65 6.65 0 11-13.3 0 6.65 6.65 0 0113.3 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="Search by location"
              className="border border-gray-300 rounded-md pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={() => { setTypeFilter(""); setStatusFilter(""); setLocationFilter(""); }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear Filters
            </button>
          )}
        </div>

        {isLoading_ ? (
          <Spinner />
        ) : isError ? (
          <div className="text-center py-20 text-gray-500">
            Failed to load requests. Please try again.
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No requests found.</p>
            {hasActiveFilters && (
              <p className="text-gray-400 text-sm mt-2">
                Try clearing the filters to see more results.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {requests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        )}
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
