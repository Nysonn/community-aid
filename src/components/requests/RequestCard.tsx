import { useState } from "react";
import OfferHelpModal from "../offers/OfferHelpModal";
import RequestDetailModal from "./RequestDetailModal";
import { canRequestReceiveDonations } from "../../utils";
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

const TYPE_STRIPE: Record<EmergencyRequest["type"], string> = {
  medical: "bg-gradient-to-r from-red-400 to-red-500",
  food: "bg-gradient-to-r from-amber-400 to-amber-500",
  rescue: "bg-gradient-to-r from-blue-500 to-blue-600",
  shelter: "bg-gradient-to-r from-green-500 to-emerald-500",
};

const TYPE_ICON_COLOR: Record<EmergencyRequest["type"], string> = {
  medical: "#ef4444",
  food: "#f59e0b",
  rescue: "#3b82f6",
  shelter: "#10b981",
};

const TYPE_ICON_BG: Record<EmergencyRequest["type"], string> = {
  medical: "#FEF2F2",
  food: "#FFFBEB",
  rescue: "#EFF6FF",
  shelter: "#ECFDF5",
};

interface Props {
  request: EmergencyRequest;
}

function isImageUrl(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower.includes("/image/upload/")) return true;
  return /\.(jpg|jpeg|png|webp|gif|avif|svg)(\?|$)/.test(lower);
}

const TYPE_ICON: Record<EmergencyRequest["type"], React.ReactNode> = {
  medical: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  food: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  rescue: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  shelter: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
};

const RequestCard = ({ request }: Props) => {
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const formattedDate = new Date(request.created_at).toLocaleDateString("en-UG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const isApproved = request.status === "approved";
  const canReceiveDonations = canRequestReceiveDonations(request);

  const firstMedia = request.media_urls?.[0];
  const thumbnailUrl = firstMedia && isImageUrl(firstMedia) ? firstMedia : null;
  const hasPdfOnly = firstMedia && !thumbnailUrl;

  const target = request.target_amount;
  const received = request.amount_received ?? 0;
  const progressPct = target && target > 0 ? Math.min(100, Math.round((received / target) * 100)) : null;

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">

        {/* Thumbnail / stripe */}
        {thumbnailUrl ? (
          <div className="relative h-40 w-full overflow-hidden bg-slate-100">
            <img
              src={thumbnailUrl}
              alt={request.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              loading="lazy"
            />
            {/* Gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            <div className={`absolute top-0 left-0 right-0 h-[3px] ${TYPE_STRIPE[request.type]}`} />
            {/* Type icon badge on image */}
            <div
              className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-[11px] font-bold backdrop-blur-md"
              style={{ background: "rgba(0,0,0,0.45)" }}
            >
              <span style={{ color: TYPE_ICON_COLOR[request.type] }}>
                {TYPE_ICON[request.type]}
              </span>
              <span className="capitalize">{request.type}</span>
            </div>
          </div>
        ) : hasPdfOnly ? (
          <div className="relative h-16 w-full bg-slate-50 flex items-center justify-center gap-2">
            <svg className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">PDF attached</span>
            <div className={`absolute top-0 left-0 right-0 h-[3px] ${TYPE_STRIPE[request.type]}`} />
          </div>
        ) : (
          <div className={`h-[4px] w-full ${TYPE_STRIPE[request.type]}`} />
        )}

        <div className="p-5 flex flex-col gap-3 flex-1">

          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            {!thumbnailUrl && (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize"
                style={{
                  background: TYPE_ICON_BG[request.type],
                  color: TYPE_ICON_COLOR[request.type],
                }}
              >
                <span className="opacity-80">{TYPE_ICON[request.type]}</span>
                {request.type}
              </span>
            )}
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${STATUS_BADGE[request.status]}`}>
              {request.status}
            </span>
            {isApproved && (
              <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-extrabold text-slate-900 text-[15px] leading-snug tracking-tight">
            {request.title}
          </h3>

          {/* Description */}
          <p className="text-[13.5px] text-slate-500 line-clamp-2 leading-relaxed -mt-0.5">
            {request.description}
          </p>

          {/* Fundraising progress */}
          {progressPct !== null && (
            <div className="space-y-1.5 bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="flex justify-between text-[11px]">
                <span className="font-bold text-emerald-600">UGX {received.toLocaleString("en-UG")} raised</span>
                <span className="text-slate-400">of UGX {target!.toLocaleString("en-UG")}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 text-right font-medium">{progressPct}% funded</p>
            </div>
          )}

          {/* Location + date row */}
          <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 min-w-0">
              <svg className="h-3.5 w-3.5 shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{request.location_name}</span>
            </span>
            <span className="shrink-0">{formattedDate}</span>
          </div>

          {/* ── Action buttons ── */}
          <div className="mt-auto pt-3 border-t border-gray-50 flex flex-col gap-2">

            {/* Primary: Donate (approved + can receive donations) */}
            {isApproved && canReceiveDonations && (
              <button
                type="button"
                onClick={() => setShowDonateModal(true)}
                className="w-full inline-flex items-center justify-center gap-2 text-[13px] font-bold text-white rounded-xl px-4 py-2.5 transition-all duration-200 active:scale-[0.98] hover:shadow-lg"
                style={{
                  background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                  boxShadow: "0 2px 12px rgba(5,150,105,0.30)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(5,150,105,0.42)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 12px rgba(5,150,105,0.30)";
                }}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Donate Now
              </button>
            )}

            {/* Donations not yet available */}
            {isApproved && !canReceiveDonations && target && target > 0 && (
              <div className="w-full inline-flex items-center justify-center gap-2 text-[12px] font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2">
                <svg className="h-3.5 w-3.5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Donations open once payout details are added
              </div>
            )}

            {/* Secondary: Offer Help + View Details */}
            <div className="flex items-center gap-2">
              {isApproved && (
                <button
                  type="button"
                  onClick={() => setShowOfferModal(true)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 text-[12.5px] font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-100 hover:border-blue-200 px-3 py-2 rounded-xl transition-colors duration-150"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Offer Help
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowDetailModal(true)}
                className={`inline-flex items-center justify-center gap-1.5 text-[12.5px] font-semibold text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-100 px-3 py-2 rounded-xl transition-colors duration-150 ${isApproved ? "flex-1" : "w-full"}`}
              >
                View Details
                <svg className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Not approved note */}
            {!isApproved && (
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 justify-center">
                <svg className="h-3.5 w-3.5 shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Offers &amp; donations open once approved
              </p>
            )}

          </div>

        </div>
      </div>

      {/* Offer Help modal (transport / expertise) */}
      <OfferHelpModal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        request={request}
      />

      {/* Donate modal — pre-selected to donation type */}
      <OfferHelpModal
        isOpen={showDonateModal}
        onClose={() => setShowDonateModal(false)}
        request={request}
        initialOfferType="donation"
      />

      <RequestDetailModal
        requestId={showDetailModal ? request.id : null}
        onClose={() => setShowDetailModal(false)}
      />
    </>
  );
};

export default RequestCard;
