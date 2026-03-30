import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";
import { getAllRequests } from "../api/requests";
import { getAllOffersAdmin } from "../api/admin";
import { getAllCachedOffers } from "../offline/db";
import { useAuth } from "../hooks/useAuth";
import { TYPE_BADGE, STATUS_BADGE } from "../components/requests/RequestCard";
import type { EmergencyRequest, Offer } from "../types";

// Fix Leaflet default marker icon in Vite
delete ((L.Icon.Default.prototype as unknown) as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIconUrl, shadowUrl: markerShadowUrl });

const UGANDA_CENTER: [number, number] = [1.3733, 32.2903];
const DEFAULT_ZOOM = 7;

const OFFER_TYPE_LABEL: Record<Offer["offer_type"], string> = {
  transport: "Transport",
  donation: "Donation",
  expertise: "Expertise",
};

const MapPage = () => {
  const { isAdmin } = useAuth();
  const [showRequests, setShowRequests] = useState(true);
  const [showOffers, setShowOffers] = useState(true);

  const { data: requests = [] } = useQuery<EmergencyRequest[]>({
    queryKey: ["map-requests"],
    queryFn: async () => {
      const result = await getAllRequests({ status: "approved" });
      return Array.isArray(result) ? result : [];
    },
    staleTime: 60_000,
  });

  const { data: offers = [] } = useQuery<Offer[]>({
    queryKey: ["map-offers", isAdmin],
    queryFn: async () => {
      const result = await (isAdmin ? getAllOffersAdmin() : getAllCachedOffers());
      return Array.isArray(result) ? result : [];
    },
    staleTime: 60_000,
  });

  const requestTitleMap = new Map(requests.map((r) => [r.id, r.title]));

  const visibleRequests = showRequests
    ? requests.filter((r) => r.latitude != null && r.longitude != null)
    : [];

  const visibleOffers = showOffers
    ? offers.filter((o) => o.latitude != null && o.longitude != null)
    : [];

  return (
    <div className="bg-[#F8F9FB] min-h-screen">

      {/* ── Page header ── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              {/* Eyebrow — mirrors hero "Live Feed" label */}
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                Live Map
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Emergency Map
              </h1>
              <p className="text-sm text-slate-500 mt-1.5">
                Real-time map of requests and responder offers across Uganda
              </p>
            </div>

            {/* Live badge pill — mirrors hero badge */}
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full self-start sm:self-auto shrink-0"
              style={{ background: "#EFF6FF", border: "1px solid #bfdbfe" }}
            >
              <span
                aria-hidden="true"
                style={{ width: "6px", height: "6px", borderRadius: "999px", background: "#22c55e", flexShrink: 0 }}
              />
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#185FA5" }}>
                Uganda · Live
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Map content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

        {/* ── Controls + legend strip — mirrors Emergency Requests filter bar ── */}
        <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3.5 mb-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">

            {/* Toggle pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowRequests((v) => !v)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                  showRequests
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-gray-200 hover:border-red-200 hover:text-red-600 hover:bg-red-50/60 shadow-sm"
                }`}
              >
                {showRequests ? "Hide Requests" : "Show Requests"}
              </button>
              <button
                onClick={() => setShowOffers((v) => !v)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                  showOffers
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-gray-200 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50/60 shadow-sm"
                }`}
              >
                {showOffers ? "Hide Offers" : "Show Offers"}
              </button>
            </div>

            {/* Vertical rule + legend */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:block w-px h-4 bg-gray-200 shrink-0" />
              <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0 shadow-sm" />
                  Emergency Requests
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shrink-0 shadow-sm" />
                  Responder Offers
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* ── Map card — mirrors hero Live Map card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden isolate shadow-[0_8px_40px_-8px_rgba(37,99,235,0.12),0_2px_12px_-4px_rgba(0,0,0,0.06)]">

          {/* Card header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-70" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              <span className="text-sm font-semibold text-slate-700">Live Map</span>
              <span className="text-xs text-slate-400 hidden sm:inline">· Uganda</span>
            </div>

            {/* Live counts */}
            <div className="flex items-center gap-3 text-xs text-slate-400">
              {showRequests && (
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  {visibleRequests.length} request{visibleRequests.length !== 1 ? "s" : ""}
                </span>
              )}
              {showOffers && (
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  {visibleOffers.length} offer{visibleOffers.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Map */}
          <MapContainer
            center={UGANDA_CENTER}
            zoom={DEFAULT_ZOOM}
            style={{ height: "clamp(360px, 55vh, 620px)", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Request markers */}
            {visibleRequests.map((request) => (
              <CircleMarker
                key={request.id}
                center={[request.latitude!, request.longitude!]}
                radius={9}
                pathOptions={{
                  color: "#b91c1c",
                  fillColor: "#ef4444",
                  fillOpacity: 0.85,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="min-w-[180px] space-y-1.5 text-sm">
                    <p className="font-semibold text-gray-900 leading-snug">{request.title}</p>
                    <div className="flex flex-wrap gap-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${TYPE_BADGE[request.type]}`}>
                        {request.type}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[request.status]}`}>
                        {request.status}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs flex items-center gap-1">
                      <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {request.location_name}
                    </p>
                    <Link
                      to={`/requests/${request.id}`}
                      className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 mt-1"
                    >
                      View Details
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* Offer markers */}
            {visibleOffers.map((offer) => (
              <CircleMarker
                key={offer.id}
                center={[offer.latitude!, offer.longitude!]}
                radius={7}
                pathOptions={{
                  color: "#1d4ed8",
                  fillColor: "#3b82f6",
                  fillOpacity: 0.85,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="min-w-[160px] space-y-1 text-sm">
                    <p className="font-semibold text-gray-900">{offer.responder_name}</p>
                    <p className="text-xs text-gray-500">
                      Offer type:{" "}
                      <span className="font-semibold text-gray-700">{OFFER_TYPE_LABEL[offer.offer_type]}</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      Request:{" "}
                      <span className="text-gray-500">{requestTitleMap.get(offer.request_id) ?? "Unknown Request"}</span>
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          {/* Card footer */}
          <div className="px-4 py-2.5 border-t border-gray-50 bg-slate-50/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                {visibleRequests.length} request{visibleRequests.length !== 1 ? "s" : ""} shown
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                {visibleOffers.length} offer{visibleOffers.length !== 1 ? "s" : ""} shown
              </span>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline">Click a marker for details</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MapPage;
