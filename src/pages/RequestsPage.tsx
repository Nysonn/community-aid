import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { useRequests } from "../hooks/useRequests";
import { saveRequestsToCache, getCachedRequests } from "../offline/db";
import RequestCard from "../components/requests/RequestCard";
import CreateRequestModal from "../components/requests/CreateRequestModal";
import type { EmergencyRequest } from "../types";

const TYPES = ["", "medical", "food", "rescue", "shelter"] as const;
const STATUSES = ["", "pending", "approved", "rejected", "closed"] as const;

const Spinner = () => (
  <div className="flex justify-center items-center py-20">
    <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const RequestsPage = () => {
  const { isSignedIn, isAdmin, user } = useAuth();
  const queryClient = useQueryClient();

  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cachedRequests, setCachedRequests] = useState<EmergencyRequest[] | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Track online/offline state
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // When offline, load from IndexedDB
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

  // Save to offline cache whenever fresh data arrives
  useEffect(() => {
    if (apiRequests && apiRequests.length > 0) {
      saveRequestsToCache(apiRequests);
    }
  }, [apiRequests]);

  const requests = isOnline ? (apiRequests ?? []) : (cachedRequests ?? []);
  const isCached = !isOnline && cachedRequests !== null;
  const isLoading_ = isLoading && isOnline;

  const handleClearFilters = () => {
    setTypeFilter("");
    setStatusFilter("");
    setLocationFilter("");
  };

  const hasActiveFilters = typeFilter || statusFilter || locationFilter;
  // Show the button for any signed-in non-admin user.
  // Using role !== "admin" (rather than role === "community_member") means the
  // button is visible while the Redux user profile is still loading (user is null)
  // so there is no flash where the button disappears after login.
  const isCommunityMember = isSignedIn && user?.role !== "admin";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Emergency Requests</h1>
        {isCommunityMember && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + Post a Request
          </button>
        )}
      </div>

      {/* Cached data banner */}
      {isCached && (
        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-2.5 rounded-md">
          Showing cached data from your last sync. Connect to the internet to see
          the latest requests.
        </div>
      )}

      {/* Filters row */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        {/* Type filter */}
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

        {/* Status filter — admin only */}
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

        {/* Location search */}
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

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Content */}
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

      {/* Create request modal */}
      <CreateRequestModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["requests"] });
        }}
      />
    </div>
  );
};

export default RequestsPage;
