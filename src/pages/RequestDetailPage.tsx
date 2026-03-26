import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../store";
import { useRequest, useApproveRequest, useRejectRequest } from "../hooks/useRequests";
import { useOffersByRequest, useCreateOffer, useUpdateOfferStatus } from "../hooks/useOffers";
import { savePendingAction } from "../offline/db";
import { addPendingAction } from "../store/slices/offlineSlice";
import { useGlobalToast } from "../components/layout/Layout";
import CreateRequestModal from "../components/requests/CreateRequestModal";
import { TYPE_BADGE, STATUS_BADGE } from "../components/requests/RequestCard";
import type { Offer } from "../types";

const OFFER_TYPE_BADGE: Record<Offer["offer_type"], string> = {
  transport: "bg-purple-100 text-purple-700",
  donation: "bg-teal-100 text-teal-700",
  expertise: "bg-orange-100 text-orange-700",
};

const OFFER_STATUS_BADGE: Record<Offer["status"], string> = {
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-green-100 text-green-700",
  fulfilled: "bg-gray-100 text-gray-600",
};

const Spinner = () => (
  <div className="flex justify-center items-center py-20">
    <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const RequestDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useGlobalToast();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAdmin = user?.role === "admin";

  const [showEditModal, setShowEditModal] = useState(false);

  // Offer form state
  const [responderName, setResponderName] = useState("");
  const [responderContact, setResponderContact] = useState("");
  const [offerType, setOfferType] = useState<Offer["offer_type"]>("donation");
  const [offerLat, setOfferLat] = useState("");
  const [offerLng, setOfferLng] = useState("");

  // Fetch request
  const {
    data: request,
    isLoading: requestLoading,
    isError: requestError,
  } = useRequest(id);

  // Fetch offers
  const { data: offers = [] } = useOffersByRequest(id);

  // Mutations
  const approveMutation = useApproveRequest();
  const rejectMutation = useRejectRequest();
  const offerStatusMutation = useUpdateOfferStatus();
  const submitOfferMutation = useCreateOffer();

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!navigator.onLine) {
      const pendingAction = {
        id: crypto.randomUUID(),
        type: "CREATE_OFFER",
        payload: {
          request_id: id!,
          responder_name: responderName,
          responder_contact: responderContact,
          offer_type: offerType,
          latitude: offerLat ? parseFloat(offerLat) : undefined,
          longitude: offerLng ? parseFloat(offerLng) : undefined,
        },
        timestamp: Date.now(),
      };
      await savePendingAction(pendingAction);
      dispatch(addPendingAction(pendingAction));
      showToast("You're offline. Offer saved and will sync when you reconnect.", "info");
      setResponderName("");
      setResponderContact("");
      setOfferType("donation");
      setOfferLat("");
      setOfferLng("");
      return;
    }

    submitOfferMutation.mutate({
      request_id: id!,
      responder_name: responderName,
      responder_contact: responderContact,
      offer_type: offerType,
      latitude: offerLat ? parseFloat(offerLat) : undefined,
      longitude: offerLng ? parseFloat(offerLng) : undefined,
    }, {
      onSuccess: () => {
        setResponderName("");
        setResponderContact("");
        setOfferType("donation");
        setOfferLat("");
        setOfferLng("");
      },
    });
  };

  const isOwner = user?.id === request?.user_id;

  if (requestLoading) return <Spinner />;
  if (requestError || !request) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-gray-500">
        Request not found or failed to load.
      </div>
    );
  }

  const formattedDate = new Date(request.created_at).toLocaleDateString("en-UG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ── Request header ── */}
      <div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">
              {request.title}
            </h1>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${TYPE_BADGE[request.type]}`}
              >
                {request.type}
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_BADGE[request.status]}`}
              >
                {request.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <span>&#128205;</span> {request.location_name}
            </p>
          </div>

          {/* Admin / owner actions */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {(isOwner || isAdmin) && (
              <button
                onClick={() => setShowEditModal(true)}
                className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Edit
              </button>
            )}
            {isAdmin && (
              <>
                <button
                  onClick={() => approveMutation.mutate(id!)}
                  disabled={approveMutation.isPending}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {approveMutation.isPending ? "..." : "Approve"}
                </button>
                <button
                  onClick={() => rejectMutation.mutate(id!)}
                  disabled={rejectMutation.isPending}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {rejectMutation.isPending ? "..." : "Reject"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="mt-4 text-gray-700 leading-relaxed">{request.description}</p>

        {/* Date */}
        <p className="mt-3 text-sm text-gray-400">Posted on {formattedDate}</p>

        {/* Media thumbnails */}
        {request.media_urls && request.media_urls.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {request.media_urls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                <img
                  src={url}
                  alt={`Media ${i + 1}`}
                  className="h-20 w-20 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity"
                />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* ── Offers of Help section ── */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Offers of Help</h2>
        <p className="text-sm text-gray-500 mb-4">
          {offers.length} {offers.length === 1 ? "offer" : "offers"} so far
        </p>

        {offers.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">
            No offers yet. Be the first to help below.
          </p>
        ) : (
          <div className="space-y-3">
            {offers.map((offer) => {
              const offerDate = new Date(offer.created_at).toLocaleDateString("en-UG", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <div
                  key={offer.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900 text-sm">
                      {offer.responder_name}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${OFFER_TYPE_BADGE[offer.offer_type]}`}
                      >
                        {offer.offer_type}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${OFFER_STATUS_BADGE[offer.status]}`}
                      >
                        {offer.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{offerDate}</p>
                  </div>

                  {/* Owner: change offer status */}
                  {isOwner && (
                    <select
                      value={offer.status}
                      onChange={(e) =>
                        offerStatusMutation.mutate({
                          offerId: offer.id,
                          status: e.target.value as Offer["status"],
                        })
                      }
                      className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="fulfilled">Fulfilled</option>
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Offer Help form ── */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Offer Help</h2>
        <form
          onSubmit={handleOfferSubmit}
          className="bg-white border border-gray-200 rounded-lg p-5 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={responderName}
                onChange={(e) => setResponderName(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={responderContact}
                onChange={(e) => setResponderContact(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Phone or email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type of Offer <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={offerType}
              onChange={(e) => setOfferType(e.target.value as Offer["offer_type"])}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="transport">Transport</option>
              <option value="donation">Donation</option>
              <option value="expertise">Expertise</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={offerLat}
                onChange={(e) => setOfferLat(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={offerLng}
                onChange={(e) => setOfferLng(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitOfferMutation.isPending}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitOfferMutation.isPending ? "Submitting..." : "Submit Offer"}
          </button>
        </form>
      </section>

      {/* Edit modal */}
      <CreateRequestModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        editRequest={request}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["request", id] });
          queryClient.invalidateQueries({ queryKey: ["requests"] });
          setShowEditModal(false);
        }}
      />
    </div>
  );
};

export default RequestDetailPage;
