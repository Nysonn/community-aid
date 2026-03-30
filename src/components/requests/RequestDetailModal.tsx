import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../store";
import {
  useRequest,
  useApproveRequest,
  useRejectRequest,
} from "../../hooks/useRequests";
import {
  useOffersByRequest,
  useCreateOffer,
  useUpdateOfferStatus,
} from "../../hooks/useOffers";
import { savePendingAction } from "../../offline/db";
import { addPendingAction } from "../../store/slices/offlineSlice";
import { useGlobalToast } from "../layout/Layout";
import CreateRequestModal from "./CreateRequestModal";
import { TYPE_BADGE, STATUS_BADGE } from "./RequestCard";
import type { CreateOfferInput, Offer } from "../../types";

interface Props {
  requestId: string | null;
  onClose: () => void;
}

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

const ModalSkeleton = () => (
  <div className="animate-pulse space-y-6">
    {/* Title + badges + location */}
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
        <div className="flex-1 space-y-3">
          <div className="h-7 bg-gray-200 rounded-full w-3/5" />
          <div className="flex items-center gap-2">
            <div className="h-5 w-16 bg-gray-100 rounded-full" />
            <div className="h-5 w-16 bg-gray-100 rounded-full" />
          </div>
          <div className="h-3.5 bg-gray-100 rounded-full w-1/3" />
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="h-8 w-20 bg-gray-100 rounded-full" />
          <div className="h-8 w-20 bg-gray-100 rounded-full" />
        </div>
      </div>
      {/* Description */}
      <div className="mt-4 pt-4 border-t border-gray-50 space-y-2">
        <div className="h-3.5 bg-gray-100 rounded-full" />
        <div className="h-3.5 bg-gray-100 rounded-full w-11/12" />
        <div className="h-3.5 bg-gray-100 rounded-full w-4/5" />
      </div>
      <div className="h-3 bg-gray-100 rounded-full w-32 mt-3" />
    </div>
    {/* Offers section */}
    <div>
      <div className="h-5 bg-gray-200 rounded-full w-32 mb-1" />
      <div className="h-3.5 bg-gray-100 rounded-full w-24 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-200 rounded-full w-28" />
              <div className="flex gap-2">
                <div className="h-4 w-16 bg-gray-100 rounded-full" />
                <div className="h-4 w-16 bg-gray-100 rounded-full" />
              </div>
              <div className="h-3 bg-gray-100 rounded-full w-20" />
            </div>
            <div className="h-7 w-16 bg-gray-100 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const RequestDetailModal = ({ requestId, onClose }: Props) => {
  const isOpen = !!requestId;
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
  // Expertise
  const [expertiseDetails, setExpertiseDetails] = useState("");
  // Transport
  const [vehicleType, setVehicleType] = useState("");
  // Donation
  const [donationAmount, setDonationAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"mobile_money" | "visa">("mobile_money");
  const [mobileProvider, setMobileProvider] = useState<"airtel_money" | "mtn_momo">("mtn_momo");
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardExpiryMonth, setCardExpiryMonth] = useState("");
  const [cardExpiryYear, setCardExpiryYear] = useState("");
  const [cardholderName, setCardholderName] = useState("");

  const { data: request, isLoading, isError } = useRequest(requestId ?? undefined);
  const { data: offers = [] } = useOffersByRequest(requestId ?? undefined);

  const approveMutation = useApproveRequest();
  const rejectMutation = useRejectRequest();
  const offerStatusMutation = useUpdateOfferStatus();
  const submitOfferMutation = useCreateOffer();

  const handleClose = () => {
    setShowEditModal(false);
    onClose();
  };

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CreateOfferInput = {
      request_id: requestId!,
      responder_name: responderName,
      responder_contact: responderContact,
      offer_type: offerType,
    };

    if (offerType === "expertise") {
      payload.expertise_details = expertiseDetails.trim();
    } else if (offerType === "transport") {
      payload.vehicle_type = vehicleType.trim();
    } else if (offerType === "donation") {
      payload.donation_amount = Number(donationAmount);
      payload.payment_method = paymentMethod;
      if (paymentMethod === "mobile_money") {
        payload.mobile_money_provider = mobileProvider;
        payload.mobile_money_number = mobileMoneyNumber.trim();
      } else {
        payload.card_number = cardNumber.replace(/\s/g, "");
        payload.card_cvc = cardCvc.trim();
        payload.card_expiry_month = Number(cardExpiryMonth);
        payload.card_expiry_year = Number(cardExpiryYear);
        payload.cardholder_name = cardholderName.trim();
      }
    }

    const resetForm = () => {
      setResponderName("");
      setResponderContact("");
      setOfferType("donation");
      setExpertiseDetails("");
      setVehicleType("");
      setDonationAmount("");
      setPaymentMethod("mobile_money");
      setMobileProvider("mtn_momo");
      setMobileMoneyNumber("");
      setCardNumber("");
      setCardCvc("");
      setCardExpiryMonth("");
      setCardExpiryYear("");
      setCardholderName("");
    };

    if (!navigator.onLine) {
      const pendingAction = {
        id: crypto.randomUUID(),
        type: "CREATE_OFFER",
        payload,
        timestamp: Date.now(),
      };
      await savePendingAction(pendingAction);
      dispatch(addPendingAction(pendingAction));
      showToast("You're offline. Offer saved and will sync when you reconnect.", "info");
      resetForm();
      return;
    }

    submitOfferMutation.mutate(payload, {
      onSuccess: () => {
        resetForm();
      },
    });
  };

  if (!isOpen) return null;

  const isOwner = user?.id === request?.user_id;

  const formattedDate = request
    ? new Date(request.created_at).toLocaleDateString("en-UG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center px-4 py-6 overflow-y-auto">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          onClick={handleClose}
          aria-hidden="true"
        />

        {/* Panel */}
        <div className="relative bg-white rounded-2xl shadow-[0_8px_40px_-8px_rgba(37,99,235,0.18),0_2px_16px_-4px_rgba(0,0,0,0.10)] w-full max-w-2xl my-auto">

          {/* Gradient accent line */}
          <div className="h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-base font-bold text-slate-900">Request Details</h2>
            </div>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-6 space-y-8 max-h-[80vh] overflow-y-auto">
            {isLoading ? (
              <ModalSkeleton />
            ) : isError || !request ? (
              <p className="text-center py-10 text-gray-500">
                Request not found or failed to load.
              </p>
            ) : (
              <>
                {/* ── Request info ── */}
                <div>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xl font-extrabold text-slate-900 mb-3 leading-tight tracking-tight">
                        {request.title}
                      </h3>
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
                      {isAdmin && request.status === "pending" && (
                        <>
                          <button
                            onClick={() => approveMutation.mutate(request.id)}
                            disabled={approveMutation.isPending}
                            className="px-4 py-1.5 text-sm font-semibold text-white bg-emerald-600 rounded-full hover:bg-emerald-700 disabled:opacity-50 transition-all duration-200 shadow-sm"
                          >
                            {approveMutation.isPending ? "..." : "Approve"}
                          </button>
                          <button
                            onClick={() => rejectMutation.mutate(request.id)}
                            disabled={rejectMutation.isPending}
                            className="px-4 py-1.5 text-sm font-semibold text-white bg-red-600 rounded-full hover:bg-red-700 disabled:opacity-50 transition-all duration-200 shadow-sm"
                          >
                            {rejectMutation.isPending ? "..." : "Reject"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="mt-4 text-slate-600 leading-relaxed border-t border-gray-50 pt-4">
                    {request.description}
                  </p>
                  <p className="mt-3 text-xs text-slate-400">
                    Posted on {formattedDate}
                  </p>

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

                {/* ── Offers list ── */}
                <section>
                  <h4 className="text-lg font-bold text-slate-900 mb-1">
                    Offers of Help
                  </h4>
                  <p className="text-sm text-slate-500 mb-4">
                    {offers.length} {offers.length === 1 ? "offer" : "offers"} so far
                  </p>

                  {offers.length === 0 ? (
                    <p className="text-sm text-slate-400 py-4 text-center">
                      No offers yet. Be the first to help below.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {offers.map((offer) => {
                        const offerDate = new Date(offer.created_at).toLocaleDateString(
                          "en-UG",
                          { month: "short", day: "numeric", year: "numeric" }
                        );

                        return (
                          <div
                            key={offer.id}
                            className="bg-white border border-gray-100 rounded-xl p-4 flex items-start justify-between gap-4 shadow-sm hover:border-gray-200 transition-colors"
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

                            {(isOwner || isAdmin) && (
                              <div className="shrink-0">
                                {offer.status === "pending" && (
                                  <button
                                    onClick={() =>
                                      offerStatusMutation.mutate({
                                        offerId: offer.id,
                                        status: "accepted",
                                      })
                                    }
                                    disabled={offerStatusMutation.isPending}
                                    className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-full hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-sm whitespace-nowrap"
                                  >
                                    Accept
                                  </button>
                                )}
                                {offer.status === "accepted" && (
                                  <button
                                    onClick={() =>
                                      offerStatusMutation.mutate({
                                        offerId: offer.id,
                                        status: "fulfilled",
                                      })
                                    }
                                    disabled={offerStatusMutation.isPending}
                                    className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-full hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm whitespace-nowrap"
                                  >
                                    Mark as Fulfilled
                                  </button>
                                )}
                                {offer.status === "fulfilled" && (
                                  <span className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full whitespace-nowrap">
                                    Completed
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* ── Offer Help form ── */}
                {request.status === "approved" && !isAdmin && (
                  <section>
                    <h4 className="text-lg font-bold text-slate-900 mb-4">
                      Offer Help
                    </h4>
                    <form
                      onSubmit={handleOfferSubmit}
                      className="bg-slate-50 border border-gray-100 rounded-2xl p-5 space-y-4"
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
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm bg-white"
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
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm bg-white"
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
                          onChange={(e) =>
                            setOfferType(e.target.value as Offer["offer_type"])
                          }
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                        >
                          <option value="transport">Transport</option>
                          <option value="donation">Donation</option>
                          <option value="expertise">Expertise</option>
                        </select>
                      </div>

                      {offerType === "expertise" && (
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Expertise Details <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            required
                            value={expertiseDetails}
                            onChange={(e) => setExpertiseDetails(e.target.value)}
                            rows={3}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm bg-white resize-none"
                            placeholder="Describe what expertise you can offer (e.g. medical professional, civil engineer...)"
                          />
                        </div>
                      )}

                      {offerType === "transport" && (
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Vehicle Type <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={vehicleType}
                            onChange={(e) => setVehicleType(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm bg-white"
                            placeholder="e.g. Pickup truck, Ambulance, Motorcycle..."
                          />
                        </div>
                      )}

                      {offerType === "donation" && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                              Donation Amount (UGX) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              min="1"
                              required
                              value={donationAmount}
                              onChange={(e) => setDonationAmount(e.target.value)}
                              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm bg-white"
                              placeholder="e.g. 50000"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                              Payment Method <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={paymentMethod}
                              onChange={(e) =>
                                setPaymentMethod(
                                  e.target.value as "mobile_money" | "visa"
                                )
                              }
                              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                            >
                              <option value="mobile_money">Mobile Money</option>
                              <option value="visa">VISA Card</option>
                            </select>
                          </div>

                          {paymentMethod === "mobile_money" && (
                            <>
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                  Provider <span className="text-red-500">*</span>
                                </label>
                                <select
                                  value={mobileProvider}
                                  onChange={(e) =>
                                    setMobileProvider(
                                      e.target.value as "airtel_money" | "mtn_momo"
                                    )
                                  }
                                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                                >
                                  <option value="mtn_momo">MTN MoMo</option>
                                  <option value="airtel_money">Airtel Money</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                  Mobile Money Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="tel"
                                  required
                                  value={mobileMoneyNumber}
                                  onChange={(e) => setMobileMoneyNumber(e.target.value)}
                                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm bg-white"
                                  placeholder="e.g. 0701234567"
                                />
                              </div>
                            </>
                          )}

                          {paymentMethod === "visa" && (
                            <div className="space-y-3">
                              <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-2.5 text-xs text-yellow-800">
                                This is a dummy payment — no real charges will be made.
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                  Card Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  required
                                  maxLength={19}
                                  value={cardNumber}
                                  onChange={(e) => setCardNumber(e.target.value)}
                                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm bg-white"
                                  placeholder="1234 5678 9012 3456"
                                />
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Exp. Month <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="12"
                                    required
                                    value={cardExpiryMonth}
                                    onChange={(e) => setCardExpiryMonth(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm bg-white"
                                    placeholder="MM"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Exp. Year <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="number"
                                    min="2026"
                                    required
                                    value={cardExpiryYear}
                                    onChange={(e) => setCardExpiryYear(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm bg-white"
                                    placeholder="YYYY"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    CVC <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    maxLength={4}
                                    value={cardCvc}
                                    onChange={(e) => setCardCvc(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm bg-white"
                                    placeholder="123"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                  Name on Card <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={cardholderName}
                                  onChange={(e) => setCardholderName(e.target.value)}
                                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm bg-white"
                                  placeholder="Cardholder name"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={submitOfferMutation.isPending}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white py-3 px-4 rounded-full text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-blue-200/60 hover:shadow-lg active:scale-[0.98]"
                      >
                        {submitOfferMutation.isPending ? "Submitting..." : "Submit Offer"}
                      </button>
                    </form>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Nested edit modal */}
      {request && (
        <CreateRequestModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          editRequest={request}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["request", requestId] });
            queryClient.invalidateQueries({ queryKey: ["requests"] });
            setShowEditModal(false);
          }}
        />
      )}
    </>
  );
};

export default RequestDetailModal;
