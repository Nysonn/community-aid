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
delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Emergency Map</h1>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button
          onClick={() => setShowRequests((v) => !v)}
          className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
            showRequests
              ? "bg-red-600 text-white border-red-600 hover:bg-red-700"
              : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
          }`}
        >
          {showRequests ? "Hide Requests" : "Show Requests"}
        </button>
        <button
          onClick={() => setShowOffers((v) => !v)}
          className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
            showOffers
              ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
              : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
          }`}
        >
          {showOffers ? "Hide Offers" : "Show Offers"}
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-5 mb-3 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
          Emergency Requests (approved)
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-blue-500" />
          Responder Offers
        </div>
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        <MapContainer
          center={UGANDA_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: "600px", width: "100%" }}
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
                  <p className="font-semibold text-gray-900 leading-snug">
                    {request.title}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${TYPE_BADGE[request.type]}`}
                    >
                      {request.type}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[request.status]}`}
                    >
                      {request.status}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs">
                    &#128205; {request.location_name}
                  </p>
                  <Link
                    to={`/requests/${request.id}`}
                    className="block text-blue-600 hover:underline text-xs font-medium mt-1"
                  >
                    View Details
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
                  <p className="font-semibold text-gray-900">
                    {offer.responder_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Offer type:{" "}
                    <span className="font-medium">
                      {OFFER_TYPE_LABEL[offer.offer_type]}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400">
                    Request:{" "}
                    {requestTitleMap.get(offer.request_id) ?? "Unknown Request"}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <p className="text-xs text-gray-400 mt-2">
        Showing {visibleRequests.length} request{visibleRequests.length !== 1 ? "s" : ""} and{" "}
        {visibleOffers.length} offer{visibleOffers.length !== 1 ? "s" : ""} with location data.
      </p>
    </div>
  );
};

export default MapPage;
