import { useState } from "react";
import OfferHelpModal from "../offers/OfferHelpModal";
import RequestDetailModal from "./RequestDetailModal";
import type { EmergencyRequest } from "../../types";

export const TYPE_BADGE: Record<EmergencyRequest["type"], string> = {
  medical: "bg-red-100 text-red-700",
  food: "bg-yellow-100 text-yellow-700",
  rescue: "bg-blue-100 text-blue-700",
  shelter: "bg-green-100 text-green-700",
};

export const STATUS_BADGE: Record<EmergencyRequest["status"], string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  closed: "bg-gray-100 text-gray-600",
};

// Top stripe color per type
const TYPE_STRIPE: Record<EmergencyRequest["type"], string> = {
  medical: "bg-red-400",
  food:    "bg-amber-400",
  rescue:  "bg-blue-500",
  shelter: "bg-green-500",
};

interface Props {
  request: EmergencyRequest;
}

const RequestCard = ({ request }: Props) => {
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const formattedDate = new Date(request.created_at).toLocaleDateString("en-UG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const isApproved = request.status === "approved";

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 group">

        {/* Type colour stripe */}
        <div className={`h-[3px] w-full ${TYPE_STRIPE[request.type]}`} />

        <div className="p-5 flex flex-col gap-3 flex-1">

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${TYPE_BADGE[request.type]}`}>
              {request.type}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${STATUS_BADGE[request.status]}`}>
              {request.status}
            </span>
            {isApproved && (
              <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Open for offers
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-extrabold text-slate-900 text-[15px] leading-snug tracking-tight">
            {request.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed -mt-0.5">
            {request.description}
          </p>

          {/* Location */}
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5 shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {request.location_name}
          </p>

          {/* Offer availability chip */}
          <div className="mt-auto">
            {isApproved ? (
              <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl w-full">
                <svg className="h-3.5 w-3.5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Anyone can offer transport, donations, or expertise.
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl w-full">
                <svg className="h-3.5 w-3.5 shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Offers open once an admin approves this request.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-50">
            <span className="text-xs text-slate-400">{formattedDate}</span>
            <div className="flex items-center gap-2">
              {isApproved && (
                <button
                  type="button"
                  onClick={() => setShowOfferModal(true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full transition-colors"
                >
                  Offer Help
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowDetailModal(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors"
              >
                View Details
                <svg className="h-3 w-3 transition-transform duration-150 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

        </div>
      </div>

      <OfferHelpModal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        request={request}
      />

      <RequestDetailModal
        requestId={showDetailModal ? request.id : null}
        onClose={() => setShowDetailModal(false)}
      />
    </>
  );
};

export default RequestCard;
