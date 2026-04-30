import { useState } from "react";
import OfferHelpModal from "../offers/OfferHelpModal";
import RequestDetailModal from "./RequestDetailModal";
import { canRequestReceiveDonations } from "../../utils";
import type { EmergencyRequest } from "../../types";

// ─── Badge colour maps (with coral/yellow palette + fallback) ──────────────────

const KNOWN_TYPES = ["medical", "food", "rescue", "shelter"] as const;
type KnownType = typeof KNOWN_TYPES[number];

function isKnownType(t: string): t is KnownType {
  return (KNOWN_TYPES as readonly string[]).includes(t);
}

const TYPE_BADGE_KNOWN: Record<KnownType, string> = {
  medical: "bg-coral-50 text-coral-600 border-coral-200",
  food:    "bg-brand-yellow-light text-brand-yellow-dark border-yellow-200",
  rescue:  "bg-[#F5F5F5] text-brand-charcoal border-[#D6D6D6]",
  shelter: "bg-orange-50 text-orange-600 border-orange-200",
};

export function typeBadgeClass(type: string): string {
  return isKnownType(type)
    ? TYPE_BADGE_KNOWN[type]
    : "bg-slate-100 text-slate-500 border-slate-200";
}

export const TYPE_BADGE: Record<string, string> = new Proxy(
  {} as Record<string, string>,
  { get: (_, key: string) => typeBadgeClass(key) }
);

export const STATUS_BADGE: Record<EmergencyRequest["status"], string> = {
  pending:  "bg-brand-yellow-light text-brand-yellow-dark",
  approved: "bg-coral-50 text-coral-600",
  rejected: "bg-[#F5F5F5] text-brand-charcoal",
  closed:   "bg-gray-100 text-gray-500",
};

const TYPE_STRIPE_KNOWN: Record<KnownType, string> = {
  medical: "bg-gradient-to-r from-coral-500 to-coral-600",
  food:    "bg-gradient-to-r from-brand-yellow to-brand-yellow-dark",
  rescue:  "bg-gradient-to-r from-brand-charcoal to-brand-charcoal-soft",
  shelter: "bg-gradient-to-r from-orange-400 to-orange-500",
};

function typeStripeClass(type: string): string {
  return isKnownType(type)
    ? TYPE_STRIPE_KNOWN[type]
    : "bg-gradient-to-r from-slate-400 to-slate-500";
}

const TYPE_ICON_COLOR_KNOWN: Record<KnownType, string> = {
  medical: "#E8452A",
  food:    "#D4A80A",
  rescue:  "#1A1A1A",
  shelter: "#EA6D0A",
};

function typeIconColor(type: string): string {
  return isKnownType(type) ? TYPE_ICON_COLOR_KNOWN[type] : "#64748b";
}

const TYPE_ICON_BG_KNOWN: Record<KnownType, string> = {
  medical: "#FEF0ED",
  food:    "#FEFCE8",
  rescue:  "#F5F5F5",
  shelter: "#FFF7ED",
};

function typeIconBg(type: string): string {
  return isKnownType(type) ? TYPE_ICON_BG_KNOWN[type] : "#F1F5F9";
}

interface Props {
  request: EmergencyRequest;
}

function isImageUrl(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower.includes("/image/upload/")) return true;
  return /\.(jpg|jpeg|png|webp|gif|avif|svg)(\?|$)/.test(lower);
}

const TYPE_ICON: Record<string, React.ReactNode> = {
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

function TypeIcon({ type }: { type: string }) {
  const icon = TYPE_ICON[type] ?? (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
  return <>{icon}</>;
}

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

  const imageUrls = (request.media_urls ?? []).filter(isImageUrl);
  const thumbnailUrl = imageUrls[0] ?? null;
  const hasPdfOnly = (request.media_urls?.length ?? 0) > 0 && !thumbnailUrl;

  const target   = request.target_amount;
  const received = request.amount_received ?? 0;
  const progressPct = target && target > 0 ? Math.min(100, Math.round((received / target) * 100)) : null;

  const iconColor = typeIconColor(request.type);
  const iconBg    = typeIconBg(request.type);
  const stripe    = typeStripeClass(request.type);

  const hasPoster = !!(request.poster_name || request.poster_phone || request.poster_email);

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300 ease-out group animate-fade-in-up">

        {/* Thumbnail / stripe */}
        {thumbnailUrl ? (
          <div className="relative h-44 w-full overflow-hidden bg-slate-100">
            <img
              src={thumbnailUrl}
              alt={request.title}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className={`absolute top-0 left-0 right-0 h-[3px] ${stripe}`} />
            <div
              className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-[11px] font-bold backdrop-blur-md"
              style={{ background: "rgba(0,0,0,0.48)" }}
            >
              <span style={{ color: iconColor }}><TypeIcon type={request.type} /></span>
              <span className="capitalize">{request.type}</span>
            </div>
            {imageUrls.length > 1 && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-[10px] font-semibold backdrop-blur-md" style={{ background: "rgba(0,0,0,0.48)" }}>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {imageUrls.length}
              </div>
            )}
          </div>
        ) : hasPdfOnly ? (
          <div className="relative h-16 w-full bg-slate-50 flex items-center justify-center gap-2">
            <svg className="h-7 w-7 text-coral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">PDF attached</span>
            <div className={`absolute top-0 left-0 right-0 h-[3px] ${stripe}`} />
          </div>
        ) : (
          <div className={`h-[4px] w-full ${stripe}`} />
        )}

        <div className="p-5 flex flex-col gap-3 flex-1">

          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            {!thumbnailUrl && (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize border"
                style={{ background: iconBg, color: iconColor, borderColor: `${iconColor}30` }}
              >
                <span className="opacity-80"><TypeIcon type={request.type} /></span>
                {request.type}
              </span>
            )}
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${STATUS_BADGE[request.status]}`}>
              {request.status}
            </span>
            {isApproved && (
              <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-coral-500">
                <span className="h-1.5 w-1.5 rounded-full bg-coral-500 animate-pulse" />
                Live
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-extrabold text-brand-charcoal text-[15px] leading-snug tracking-tight">
            {request.title}
          </h3>

          {/* Description */}
          <p className="text-[13.5px] text-slate-500 line-clamp-2 leading-relaxed -mt-0.5">
            {request.description}
          </p>

          {/* Fundraising progress */}
          {progressPct !== null && (
            <div className="space-y-1.5 bg-coral-50 rounded-xl p-3 border border-coral-100">
              <div className="flex justify-between text-[11px]">
                <span className="font-bold text-coral-600">UGX {received.toLocaleString("en-UG")} raised</span>
                <span className="text-slate-400">of UGX {target!.toLocaleString("en-UG")}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-coral-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-coral-400 to-coral-500 transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-[10px] text-coral-400 text-right font-medium">{progressPct}% funded</p>
            </div>
          )}

          {/* Poster info */}
          {hasPoster && (
            <div className="flex flex-col gap-0.5 text-[11.5px] text-slate-500 -mt-0.5">
              {request.poster_name && (
                <span className="font-semibold text-brand-charcoal-soft">{request.poster_name}</span>
              )}
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-slate-400">
                {request.poster_phone && (
                  <a href={`tel:${request.poster_phone}`} className="hover:text-coral-500 transition-colors flex items-center gap-1">
                    <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    {request.poster_phone}
                  </a>
                )}
                {request.poster_email && (
                  <a href={`mailto:${request.poster_email}`} className="hover:text-coral-500 transition-colors flex items-center gap-1">
                    <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    {request.poster_email}
                  </a>
                )}
              </div>
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

            {/* Primary: Donate */}
            {isApproved && canReceiveDonations && (
              <button
                type="button"
                onClick={() => setShowDonateModal(true)}
                className="w-full inline-flex items-center justify-center gap-2 text-[13px] font-bold text-white rounded-xl px-4 py-2.5 transition-all duration-200 active:scale-[0.97] hover:shadow-coral-lg"
                style={{
                  background: "linear-gradient(135deg, #E8452A 0%, #C53B22 100%)",
                  boxShadow: "0 2px 12px rgba(232,69,42,0.30)",
                }}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Donate Now
              </button>
            )}

            {/* Donations pending payout details */}
            {isApproved && !canReceiveDonations && target && target > 0 && (
              <div className="w-full inline-flex items-center justify-center gap-2 text-[12px] font-medium text-brand-yellow-dark bg-brand-yellow-light border border-yellow-200 rounded-xl px-4 py-2">
                <svg className="h-3.5 w-3.5 shrink-0 text-brand-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  className="flex-1 inline-flex items-center justify-center gap-1.5 text-[12.5px] font-semibold text-brand-charcoal hover:text-white bg-brand-yellow-light hover:bg-brand-yellow border border-yellow-200 hover:border-brand-yellow px-3 py-2 rounded-xl transition-all duration-200"
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
                className={`inline-flex items-center justify-center gap-1.5 text-[12.5px] font-semibold text-slate-600 hover:text-brand-charcoal bg-slate-50 hover:bg-slate-100 border border-slate-100 px-3 py-2 rounded-xl transition-colors duration-150 ${isApproved ? "flex-1" : "w-full"}`}
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

      <OfferHelpModal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        request={request}
      />
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
