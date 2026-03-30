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
  <div className="flex justify-center items-center py-24">
    <div className="h-9 w-9 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* ── Request header ── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-card">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3 leading-tight tracking-tight">
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
            <p className="text-sm text-slate-500 flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {request.location_name}
            </p>
          </div>

          {/* Admin / owner actions */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {(isOwner || isAdmin) && (
              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-1.5 text-sm font-semibold border-2 border-gray-200 rounded-full hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
              >
                Edit
              </button>
            )}
            {isAdmin && (
              <>
                <button
                  onClick={() => approveMutation.mutate(id!)}
                  disabled={approveMutation.isPending}
                  className="px-4 py-1.5 text-sm font-semibold text-white bg-emerald-600 rounded-full hover:bg-emerald-700 disabled:opacity-50 transition-all duration-200 shadow-sm"
                >
                  {approveMutation.isPending ? "..." : "Approve"}
                </button>
                <button
                  onClick={() => rejectMutation.mutate(id!)}
                  disabled={rejectMutation.isPending}
                  className="px-4 py-1.5 text-sm font-semibold text-white bg-red-600 rounded-full hover:bg-red-700 disabled:opacity-50 transition-all duration-200 shadow-sm"
                >
                  {rejectMutation.isPending ? "..." : "Reject"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="mt-5 text-slate-600 leading-relaxed border-t border-gray-50 pt-5">{request.description}</p>

        {/* Date */}
        <p className="mt-3 text-xs text-slate-400">Posted on {formattedDate}</p>

        {/* Media thumbnails */}
        {request.media_urls && request.media_urls.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {request.media_urls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                <img
                  src={url}
                  alt={`Media ${i + 1}`}
                  className="h-20 w-20 object-cover rounded-xl border border-gray-100 hover:opacity-90 hover:scale-105 transition-all duration-200"
                />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* ── Offers of Help section ── */}
      <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-card">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Offers of Help</h2>
        <p className="text-sm text-slate-500 mb-5">
          {offers.length} {offers.length === 1 ? "offer" : "offers"} so far
        </p>

        {offers.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">
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
                  className="bg-slate-50 border border-gray-100 rounded-xl p-4 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <p className="font-semibold text-slate-900 text-sm">
                      {offer.responder_name}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${OFFER_TYPE_BADGE[offer.offer_type]}`}
                      >
                        {offer.offer_type}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${OFFER_STATUS_BADGE[offer.status]}`}
                      >
                        {offer.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{offerDate}</p>
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
                      className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
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
      <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-card">
        <h2 className="text-lg font-bold text-slate-900 mb-5">Offer Help</h2>
        <form
          onSubmit={handleOfferSubmit}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={responderName}
                onChange={(e) => setResponderName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Contact <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={responderContact}
                onChange={(e) => setResponderContact(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                placeholder="Phone or email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Type of Offer <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={offerType}
              onChange={(e) => setOfferType(e.target.value as Offer["offer_type"])}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            >
              <option value="transport">Transport</option>
              <option value="donation">Donation</option>
              <option value="expertise">Expertise</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={offerLat}
                onChange={(e) => setOfferLat(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={offerLng}
                onChange={(e) => setOfferLng(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                placeholder="Optional"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitOfferMutation.isPending}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-full text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
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
