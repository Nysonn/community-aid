import { useState } from "react";
import { useDispatch } from "react-redux";
import { useCreateOffer } from "../../hooks/useOffers";
import { savePendingAction } from "../../offline/db";
import { addPendingAction } from "../../store/slices/offlineSlice";
import { useGlobalToast } from "../layout/Layout";
import type { AppDispatch } from "../../store";
import type { CreateOfferInput, EmergencyRequest, Offer } from "../../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  request: EmergencyRequest;
}

const OFFER_TYPES: Array<Offer["offer_type"]> = [
  "transport",
  "donation",
  "expertise",
];

const OfferHelpModal = ({ isOpen, onClose, request }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useGlobalToast();
  const createOfferMutation = useCreateOffer();

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

  const handleClose = () => {
    if (!createOfferMutation.isPending) {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (request.status !== "approved") {
      showToast("Offers can only be submitted on approved requests.", "error");
      return;
    }

    const trimmedResponderName = responderName.trim();
    const trimmedResponderContact = responderContact.trim();

    if (!trimmedResponderName || !trimmedResponderContact) {
      showToast("Your name and contact information are required.", "error");
      return;
    }

    if (offerType === "expertise" && !expertiseDetails.trim()) {
      showToast("Please describe the expertise you are offering.", "error");
      return;
    }
    if (offerType === "transport" && !vehicleType.trim()) {
      showToast("Please specify the type of vehicle you can provide.", "error");
      return;
    }
    if (offerType === "donation") {
      if (!donationAmount || Number(donationAmount) <= 0) {
        showToast("Please enter a valid donation amount.", "error");
        return;
      }
      if (paymentMethod === "mobile_money" && !mobileMoneyNumber.trim()) {
        showToast("Please enter your mobile money number.", "error");
        return;
      }
      if (
        paymentMethod === "visa" &&
        (!cardNumber.trim() || !cardCvc.trim() || !cardExpiryMonth || !cardExpiryYear || !cardholderName.trim())
      ) {
        showToast("Please fill in all card details.", "error");
        return;
      }
    }

    const payload: CreateOfferInput = {
      request_id: request.id,
      responder_name: trimmedResponderName,
      responder_contact: trimmedResponderContact,
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

    if (!navigator.onLine) {
      const pendingAction = {
        id: crypto.randomUUID(),
        type: "CREATE_OFFER",
        payload,
        timestamp: Date.now(),
      };

      await savePendingAction(pendingAction);
      dispatch(addPendingAction(pendingAction));
      showToast(
        "You're offline. Your offer has been saved and will sync when you reconnect.",
        "info"
      );
      resetForm();
      onClose();
      return;
    }

    createOfferMutation.mutate(payload, {
      onSuccess: () => {
        resetForm();
        onClose();
      },
      onError: async (err) => {
        const status = (err as Error & { status?: number }).status;
        if (!status) {
          // True network failure — treat as offline and queue
          const pendingAction = {
            id: crypto.randomUUID(),
            type: "CREATE_OFFER",
            payload,
            timestamp: Date.now(),
          };
          await savePendingAction(pendingAction);
          dispatch(addPendingAction(pendingAction));
          showToast(
            "You're offline. Your offer has been saved and will sync when you reconnect.",
            "info"
          );
          resetForm();
          onClose();
        }
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative bg-white rounded-2xl shadow-[0_8px_40px_-8px_rgba(37,99,235,0.18),0_2px_16px_-4px_rgba(0,0,0,0.10)] w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Gradient accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-start gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Offer Help</h2>
              <p className="text-xs text-slate-400 mt-0.5 leading-snug max-w-[280px] truncate">
                {request.title} · {request.location_name}
              </p>
            </div>
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

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 flex items-start gap-2.5">
            <svg className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-emerald-800">
              This request has been approved — you can offer help without creating an account.
            </p>
          </div>

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
                placeholder="Phone number or email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Type of Help <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={offerType}
              onChange={(e) => setOfferType(e.target.value as Offer["offer_type"])}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            >
              {OFFER_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
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
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm resize-none"
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
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
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
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
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
                    setPaymentMethod(e.target.value as "mobile_money" | "visa")
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
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
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
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
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
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
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
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
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
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
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
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                      placeholder="Cardholder name"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-50">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 border-2 border-gray-200 rounded-full hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createOfferMutation.isPending}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-blue-200/60 hover:shadow-lg active:scale-95"
            >
              {createOfferMutation.isPending ? "Submitting..." : "Submit Offer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OfferHelpModal;