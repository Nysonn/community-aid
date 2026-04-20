import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { TYPE_BADGE, STATUS_BADGE } from "../components/requests/RequestCard";
import {
  useAdminStats,
  useAdminRequests,
  useAdminOffers,
  useAdminUsers,
  useActivateUser,
  useDeactivateUser,
  useAdminDonations,
  useAdminDisbursements,
  useMarkDisbursed,
  usePromoteToAdmin,
  useDemoteFromAdmin,
} from "../hooks/useAdmin";
import { useApproveRequest, useRejectRequest } from "../hooks/useRequests";
import { useUpdateOfferStatus } from "../hooks/useOffers";
import RequestDetailModal from "../components/requests/RequestDetailModal";
import type { Offer } from "../types";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const OFFER_TYPE_BADGE: Record<Offer["offer_type"], string> = {
  transport: "bg-blue-50 text-blue-700 border-blue-200",
  donation: "bg-teal-50 text-teal-700 border-teal-200",
  expertise: "bg-orange-50 text-orange-700 border-orange-200",
};

const OFFER_STATUS_BADGE: Record<Offer["status"], string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  fulfilled: "bg-slate-100 text-slate-500 border-slate-200",
};

function formatUGX(amount: number): string {
  return `UGX ${amount.toLocaleString("en-UG")}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-UG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize border ${className}`}>
      {label}
    </span>
  );
}

// ─── Table primitives ──────────────────────────────────────────────────────────

function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm bg-white">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

function THead({ columns }: { columns: string[] }) {
  return (
    <thead>
      <tr style={{ background: "linear-gradient(90deg, #f8faff 0%, #f0f6ff 100%)", borderBottom: "1px solid #e2e8f0" }}>
        {columns.map((col) => (
          <th key={col} className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
            {col}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function EmptyRow({ message }: { message: string }) {
  return (
    <tr>
      <td colSpan={99} className="px-5 py-14 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
            <svg className="h-5 w-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-sm text-slate-400 font-medium">{message}</p>
        </div>
      </td>
    </tr>
  );
}

// ─── Skeletons ─────────────────────────────────────────────────────────────────

function TableRowSkeleton({ cols }: { cols: number[] }) {
  return (
    <tr className="border-b border-gray-50">
      {cols.map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className={`h-3.5 bg-gray-100 rounded-full animate-pulse w-${w}/12`} />
        </td>
      ))}
    </tr>
  );
}

// ─── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
  bg,
  border,
  iconPath,
}: {
  label: string;
  value: string | number;
  color: string;
  bg: string;
  border: string;
  iconPath: string;
}) {
  return (
    <div
      className="bg-white rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={{ border: `1px solid ${border}`, boxShadow: "0 1px 6px rgba(15,23,42,0.06)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-slate-500 leading-snug">{label}</p>
        <div
          className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: bg }}
        >
          <svg className="h-4 w-4" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
          </svg>
        </div>
      </div>
      <p className="text-2xl font-extrabold text-slate-900 leading-none">{value}</p>
      <div className="h-1 rounded-full" style={{ background: bg }}>
        <div className="h-1 rounded-full w-3/4" style={{ background: color, opacity: 0.5 }} />
      </div>
    </div>
  );
}

// ─── Section header ────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  subtitle,
  count,
}: {
  title: string;
  subtitle?: string;
  count?: number;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2.5 mb-0.5">
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">{title}</h2>
          {count !== undefined && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
              {count}
            </span>
          )}
        </div>
        {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Filter row ────────────────────────────────────────────────────────────────

const REQUEST_TYPES = ["medical", "food", "rescue", "shelter"] as const;
const REQUEST_STATUSES = ["pending", "approved", "rejected", "closed"] as const;

function RequestFilters({
  typeFilter,
  statusFilter,
  locationFilter,
  onType,
  onStatus,
  onLocation,
  onClear,
}: {
  typeFilter: string;
  statusFilter: string;
  locationFilter: string;
  onType: (v: string) => void;
  onStatus: (v: string) => void;
  onLocation: (v: string) => void;
  onClear: () => void;
}) {
  const hasFilters = typeFilter || statusFilter || locationFilter;
  const selectClass =
    "border border-gray-200 rounded-xl px-3.5 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm transition-shadow";

  return (
    <div className="flex flex-wrap gap-2.5 mb-6 items-center p-4 bg-slate-50/70 rounded-2xl border border-gray-100">
      <svg className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
      </svg>
      <select value={typeFilter} onChange={(e) => onType(e.target.value)} className={selectClass}>
        <option value="">All Types</option>
        {REQUEST_TYPES.map((t) => (
          <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
        ))}
      </select>
      <select value={statusFilter} onChange={(e) => onStatus(e.target.value)} className={selectClass}>
        <option value="">All Statuses</option>
        {REQUEST_STATUSES.map((s) => (
          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
        ))}
      </select>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M16.65 10a6.65 6.65 0 11-13.3 0 6.65 6.65 0 0113.3 0z" />
          </svg>
        </span>
        <input
          type="text"
          value={locationFilter}
          onChange={(e) => onLocation(e.target.value)}
          placeholder="Search location…"
          className={`${selectClass} pl-9 w-44`}
        />
      </div>
      {hasFilters && (
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white border border-transparent hover:border-gray-200"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear
        </button>
      )}
    </div>
  );
}

// ─── Action button helpers ─────────────────────────────────────────────────────

function ActionBtn({
  onClick,
  disabled,
  variant,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  variant: "green" | "red" | "blue" | "outline" | "indigo";
  children: React.ReactNode;
}) {
  const styles: Record<string, string> = {
    green: "bg-emerald-500 hover:bg-emerald-600 text-white border-transparent shadow-sm shadow-emerald-200",
    red: "bg-red-500 hover:bg-red-600 text-white border-transparent shadow-sm shadow-red-200",
    blue: "bg-blue-600 hover:bg-blue-700 text-white border-transparent shadow-sm shadow-blue-200",
    indigo: "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200",
    outline: "bg-white hover:bg-slate-50 text-slate-600 border-gray-200",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

// ─── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab() {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        {[3, 4, 3].map((n, gi) => (
          <div key={gi} className={`grid grid-cols-2 lg:grid-cols-${n === 4 ? 4 : n} gap-4`}>
            {Array.from({ length: n }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 h-28" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return <p className="text-slate-400 text-sm">Failed to load statistics.</p>;
  }

  return (
    <div className="space-y-8">
      {/* People */}
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="h-px flex-1 bg-gray-100" /> People <span className="h-px flex-1 bg-gray-100" />
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Total Community Members" value={stats.total_users} color="#185FA5" bg="#EFF6FF" border="#BFDBFE" iconPath="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          <StatCard label="Active Members" value={stats.active_users} color="#059669" bg="#ECFDF5" border="#A7F3D0" iconPath="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          <StatCard label="Inactive Members" value={stats.total_users - stats.active_users} color="#94a3b8" bg="#f8fafc" border="#e2e8f0" iconPath="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </div>
      </div>

      {/* Requests */}
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="h-px flex-1 bg-gray-100" /> Requests <span className="h-px flex-1 bg-gray-100" />
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Requests" value={stats.total_requests} color="#185FA5" bg="#EFF6FF" border="#BFDBFE" iconPath="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          <StatCard label="Pending Review" value={stats.pending_requests} color="#D97706" bg="#FFFBEB" border="#FDE68A" iconPath="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          <StatCard label="Approved" value={stats.approved_requests} color="#059669" bg="#ECFDF5" border="#A7F3D0" iconPath="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          <StatCard label="Rejected" value={stats.rejected_requests} color="#DC2626" bg="#FEF2F2" border="#FECACA" iconPath="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </div>
      </div>

      {/* Aid & Finance */}
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="h-px flex-1 bg-gray-100" /> Aid &amp; Finance <span className="h-px flex-1 bg-gray-100" />
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Offers" value={stats.total_offers} color="#185FA5" bg="#EFF6FF" border="#BFDBFE" iconPath="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          <StatCard label="Fulfilled Offers" value={stats.fulfilled_offers} color="#059669" bg="#ECFDF5" border="#A7F3D0" iconPath="M5 13l4 4L19 7" />
          <StatCard label="Total Donations" value={stats.total_donations} color="#185FA5" bg="#EFF6FF" border="#BFDBFE" iconPath="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          <StatCard label="Total Aid Mobilised" value={formatUGX(stats.total_donation_amount)} color="#D97706" bg="#FFFBEB" border="#FDE68A" iconPath="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </div>
      </div>
    </div>
  );
}

// ─── Requests Tab ──────────────────────────────────────────────────────────────

function RequestsTab() {
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const filters = {
    ...(typeFilter && { type: typeFilter }),
    ...(statusFilter && { status: statusFilter }),
    ...(locationFilter && { location_name: locationFilter }),
  };

  const { data: requests = [], isLoading } = useAdminRequests(
    Object.keys(filters).length ? filters : undefined
  );
  const approveMutation = useApproveRequest();
  const rejectMutation = useRejectRequest();

  return (
    <div>
      <SectionHeader
        title="Emergency Requests"
        subtitle="Review, approve, or reject incoming requests from the community."
        count={requests.length}
      />
      <RequestFilters
        typeFilter={typeFilter}
        statusFilter={statusFilter}
        locationFilter={locationFilter}
        onType={setTypeFilter}
        onStatus={setStatusFilter}
        onLocation={setLocationFilter}
        onClear={() => { setTypeFilter(""); setStatusFilter(""); setLocationFilter(""); }}
      />

      <TableWrap>
        <THead columns={["Title", "Type", "Status", "Location", "Posted By", "Date", "Actions"]} />
        <tbody className="divide-y divide-gray-50 bg-white">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={[6, 3, 3, 4, 3, 4, 3]} />)
            : requests.length === 0
            ? <EmptyRow message="No requests match the current filters." />
            : requests.map((r) => (
                <tr key={r.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-5 py-4 max-w-[200px]">
                    <p className="font-semibold text-slate-900 truncate text-sm">{r.title}</p>
                  </td>
                  <td className="px-5 py-4">
                    <Badge label={r.type} className={TYPE_BADGE[r.type]} />
                  </td>
                  <td className="px-5 py-4">
                    <Badge label={r.status} className={STATUS_BADGE[r.status]} />
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-sm max-w-[140px] truncate">{r.location_name}</td>
                  <td className="px-5 py-4 text-slate-700 text-sm">
                    {r.poster_name || <span className="font-mono text-xs text-slate-400">{r.user_id.slice(0, 8)}…</span>}
                  </td>
                  <td className="px-5 py-4 text-slate-400 whitespace-nowrap text-xs">{formatDate(r.created_at)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      {r.status === "pending" && (
                        <>
                          <ActionBtn
                            variant="green"
                            onClick={() => approveMutation.mutate(r.id)}
                            disabled={approveMutation.isPending && approveMutation.variables === r.id}
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            Approve
                          </ActionBtn>
                          <ActionBtn
                            variant="red"
                            onClick={() => rejectMutation.mutate(r.id)}
                            disabled={rejectMutation.isPending && rejectMutation.variables === r.id}
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            Reject
                          </ActionBtn>
                        </>
                      )}
                      <ActionBtn variant="outline" onClick={() => setSelectedRequestId(r.id)}>
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        View
                      </ActionBtn>
                    </div>
                  </td>
                </tr>
              ))
          }
        </tbody>
      </TableWrap>

      <RequestDetailModal requestId={selectedRequestId} onClose={() => setSelectedRequestId(null)} />
    </div>
  );
}

// ─── Offers Tab ────────────────────────────────────────────────────────────────

function OffersTab() {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const { data: offers = [], isLoading } = useAdminOffers();
  const offerStatusMutation = useUpdateOfferStatus();

  return (
    <div>
      <SectionHeader
        title="Offers & Responses"
        subtitle="Track volunteer and donor offers linked to active emergency requests."
        count={offers.length}
      />
      <TableWrap>
        <THead columns={["Responder", "Contact", "Type", "Status", "Request", "Date", "Actions"]} />
        <tbody className="divide-y divide-gray-50 bg-white">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={[4, 5, 3, 3, 2, 4, 3]} />)
            : offers.length === 0
            ? <EmptyRow message="No offers found." />
            : offers.map((o) => (
                <tr key={o.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-5 py-4 font-semibold text-slate-900 text-sm">{o.responder_name}</td>
                  <td className="px-5 py-4 text-slate-500 text-sm">{o.responder_contact}</td>
                  <td className="px-5 py-4">
                    <Badge label={o.offer_type} className={OFFER_TYPE_BADGE[o.offer_type]} />
                  </td>
                  <td className="px-5 py-4">
                    <Badge label={o.status} className={OFFER_STATUS_BADGE[o.status]} />
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => setSelectedRequestId(o.request_id)}
                      title="View linked request"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      View
                    </button>
                  </td>
                  <td className="px-5 py-4 text-slate-400 whitespace-nowrap text-xs">{formatDate(o.created_at)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      {o.status === "pending" && (
                        <ActionBtn
                          variant="green"
                          onClick={() => offerStatusMutation.mutate({ offerId: o.id, status: "accepted" })}
                          disabled={offerStatusMutation.isPending}
                        >
                          Accept
                        </ActionBtn>
                      )}
                      {o.status === "accepted" && (
                        <ActionBtn
                          variant="blue"
                          onClick={() => offerStatusMutation.mutate({ offerId: o.id, status: "fulfilled" })}
                          disabled={offerStatusMutation.isPending}
                        >
                          Mark Fulfilled
                        </ActionBtn>
                      )}
                      {o.status === "fulfilled" && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                          Completed
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
          }
        </tbody>
      </TableWrap>
      <RequestDetailModal requestId={selectedRequestId} onClose={() => setSelectedRequestId(null)} />
    </div>
  );
}

// ─── Members Tab ───────────────────────────────────────────────────────────────

function UsersTab() {
  const { data: allUsers = [], isLoading } = useAdminUsers();
  const members = allUsers.filter((u) => u.role !== "admin");
  const admins = allUsers.filter((u) => u.role === "admin");
  const activateMutation = useActivateUser();
  const deactivateMutation = useDeactivateUser();
  const promoteMutation = usePromoteToAdmin();
  const demoteMutation = useDemoteFromAdmin();

  return (
    <div className="space-y-10">
      {/* Admin accounts */}
      <div>
        <SectionHeader
          title="Admin Accounts"
          subtitle="Admins can approve requests, manage members, and disburse funds."
          count={admins.length}
        />
        <TableWrap>
          <THead columns={["Full Name", "Email", "Role", "Actions"]} />
          <tbody className="divide-y divide-gray-50 bg-white">
            {isLoading
              ? Array.from({ length: 2 }).map((_, i) => <TableRowSkeleton key={i} cols={[4, 6, 2, 3]} />)
              : admins.length === 0
              ? <EmptyRow message="No admin accounts yet." />
              : admins.map((u) => (
                  <tr key={u.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {u.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-900 text-sm">{u.full_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-sm">{u.email}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        Admin
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <ActionBtn
                        variant="outline"
                        onClick={() => demoteMutation.mutate(u.id)}
                        disabled={demoteMutation.isPending && demoteMutation.variables === u.id}
                      >
                        Remove Admin
                      </ActionBtn>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </TableWrap>
      </div>

      {/* Community members */}
      <div>
        <SectionHeader
          title="Community Members"
          subtitle="Manage member status and promote trusted members to admin."
          count={members.length}
        />
        <TableWrap>
          <THead columns={["Member", "Email", "Phone", "Status", "Joined", "Actions"]} />
          <tbody className="divide-y divide-gray-50 bg-white">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={[4, 5, 4, 3, 4, 3]} />)
              : members.length === 0
              ? <EmptyRow message="No community members found." />
              : members.map((u) => (
                  <tr key={u.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ background: u.is_active ? "linear-gradient(135deg, #185FA5, #2563eb)" : "#94a3b8" }}
                        >
                          {u.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-900 text-sm">{u.full_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-sm">{u.email}</td>
                    <td className="px-5 py-4 text-slate-500 text-sm">{u.phone_number || "—"}</td>
                    <td className="px-5 py-4">
                      <Badge
                        label={u.is_active ? "Active" : "Inactive"}
                        className={u.is_active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                        }
                      />
                    </td>
                    <td className="px-5 py-4 text-slate-400 whitespace-nowrap text-xs">{formatDate(u.created_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        {u.is_active ? (
                          <ActionBtn
                            variant="red"
                            onClick={() => deactivateMutation.mutate(u.id)}
                            disabled={deactivateMutation.isPending && deactivateMutation.variables === u.id}
                          >
                            Deactivate
                          </ActionBtn>
                        ) : (
                          <ActionBtn
                            variant="green"
                            onClick={() => activateMutation.mutate(u.id)}
                            disabled={activateMutation.isPending && activateMutation.variables === u.id}
                          >
                            Activate
                          </ActionBtn>
                        )}
                        <ActionBtn
                          variant="indigo"
                          onClick={() => promoteMutation.mutate(u.id)}
                          disabled={promoteMutation.isPending && promoteMutation.variables === u.id}
                        >
                          Make Admin
                        </ActionBtn>
                      </div>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </TableWrap>
      </div>
    </div>
  );
}

// ─── Donations Tab ─────────────────────────────────────────────────────────────

function DonationsTab() {
  const { data: donations = [], isLoading: donationsLoading } = useAdminDonations();
  const { data: allRequests = [] } = useAdminRequests();
  const requestTitleMap = new Map(allRequests.map((r) => [r.id, r.title]));

  const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div>
      <SectionHeader
        title="Donations"
        subtitle="All donations collected across emergency requests."
        count={donations.length}
      />

      {/* Summary strip */}
      {!donationsLoading && donations.length > 0 && (
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-3">
            <svg className="h-5 w-5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-xs text-blue-600 font-semibold">Total Collected</p>
              <p className="text-base font-extrabold text-blue-900">{formatUGX(totalAmount)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3">
            <svg className="h-5 w-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p className="text-xs text-emerald-600 font-semibold">Total Donors</p>
              <p className="text-base font-extrabold text-emerald-900">{donations.length}</p>
            </div>
          </div>
        </div>
      )}

      <TableWrap>
        <THead columns={["Donor Name", "Amount", "For Request", "Date"]} />
        <tbody className="divide-y divide-gray-50 bg-white">
          {donationsLoading
            ? Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={[4, 3, 6, 4]} />)
            : donations.length === 0
            ? <EmptyRow message="No donations recorded yet." />
            : donations.map((d) => (
                <tr key={d.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">
                        {d.donor_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-900 text-sm">{d.donor_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-bold text-emerald-700 text-sm">{formatUGX(d.amount)}</span>
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-sm max-w-[220px] truncate">
                    {requestTitleMap.get(d.request_id) ?? (
                      <span className="font-mono text-xs text-slate-400">{d.request_id.slice(0, 8)}…</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-400 whitespace-nowrap text-xs">{formatDate(d.date)}</td>
                </tr>
              ))
          }
        </tbody>
      </TableWrap>
    </div>
  );
}

// ─── Disbursements Tab ─────────────────────────────────────────────────────────

function DisbursementsTab() {
  const [statusFilter, setStatusFilter] = useState<"" | "pending" | "disbursed">("");
  const { data: disbursements = [], isLoading } = useAdminDisbursements(statusFilter || undefined);
  const disburseMutation = useMarkDisbursed();

  const pending = disbursements.filter((d) => d.status === "pending");
  const disbursed = disbursements.filter((d) => d.status === "disbursed");

  return (
    <div>
      <SectionHeader
        title="Fund Disbursements"
        subtitle="Forward collected donations to recipients. Both donor and recipient are notified by email once marked disbursed."
        count={disbursements.length}
      />

      {/* Summary strip */}
      {!isLoading && disbursements.length > 0 && (
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-3">
            <svg className="h-5 w-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-xs text-amber-600 font-semibold">Pending Disbursement</p>
              <p className="text-base font-extrabold text-amber-900">{pending.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3">
            <svg className="h-5 w-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-xs text-emerald-600 font-semibold">Disbursed</p>
              <p className="text-base font-extrabold text-emerald-900">{disbursed.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6">
        {(["", "pending", "disbursed"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
              statusFilter === s
                ? "border-blue-500 text-blue-700 bg-blue-50"
                : "border-gray-200 text-slate-500 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <TableWrap>
        <THead columns={["Request", "Donor", "Amount", "Send To", "Payment Details", "Status", "Actions"]} />
        <tbody className="divide-y divide-gray-50 bg-white">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} cols={[5, 4, 3, 4, 5, 3, 3]} />)
            : disbursements.length === 0
            ? <EmptyRow message="No disbursements found." />
            : disbursements.map((d) => (
                <tr key={d.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-5 py-4 max-w-[160px]">
                    <p className="font-semibold text-slate-900 text-xs truncate">{d.request_title}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-slate-900">{d.donor_name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{d.donor_email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-bold text-emerald-700 text-sm whitespace-nowrap">{formatUGX(d.amount)}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-700 font-medium">{d.recipient_name}</td>
                  <td className="px-5 py-4">
                    {d.payment_type === "bank" ? (
                      <div className="space-y-0.5 text-xs text-slate-500">
                        <p><span className="font-semibold text-slate-700">Bank:</span> {d.bank_name}</p>
                        <p><span className="font-semibold text-slate-700">Acc:</span> {d.bank_account_number}</p>
                        <p><span className="font-semibold text-slate-700">Name:</span> {d.bank_account_name}</p>
                      </div>
                    ) : (
                      <div className="space-y-0.5 text-xs text-slate-500">
                        <p>
                          <span className="font-semibold text-slate-700">
                            {d.receiving_mobile_provider === "mtn_momo" ? "MTN MoMo" : "Airtel Money"}
                          </span>
                        </p>
                        <p>{d.receiving_mobile_number}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1 items-start">
                      <Badge
                        label={d.status}
                        className={d.status === "pending"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }
                      />
                      {d.disbursed_at && (
                        <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(d.disbursed_at)}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {d.status === "pending" ? (
                      <ActionBtn
                        variant="green"
                        onClick={() => disburseMutation.mutate(d.id)}
                        disabled={disburseMutation.isPending && disburseMutation.variables === d.id}
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        Mark Disbursed
                      </ActionBtn>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        Done
                      </span>
                    )}
                  </td>
                </tr>
              ))
          }
        </tbody>
      </TableWrap>
    </div>
  );
}

// ─── Sidebar items ─────────────────────────────────────────────────────────────

type Tab = "overview" | "requests" | "offers" | "users" | "donations" | "disbursements";

const SIDEBAR_ITEMS: { id: Tab; label: string; subtitle: string; color: string; bg: string; border: string; iconPath: string }[] = [
  {
    id: "overview",
    label: "Overview",
    subtitle: "Stats at a glance",
    color: "#185FA5",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    iconPath: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
  {
    id: "requests",
    label: "Requests",
    subtitle: "Review & approve",
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
    iconPath: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  },
  {
    id: "offers",
    label: "Offers",
    subtitle: "Responder activity",
    color: "#185FA5",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    iconPath: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  },
  {
    id: "users",
    label: "Members",
    subtitle: "Manage community",
    color: "#059669",
    bg: "#ECFDF5",
    border: "#A7F3D0",
    iconPath: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  },
  {
    id: "donations",
    label: "Donations",
    subtitle: "Track incoming funds",
    color: "#185FA5",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    iconPath: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    id: "disbursements",
    label: "Disbursements",
    subtitle: "Send funds to recipients",
    color: "#DC2626",
    bg: "#FEF2F2",
    border: "#FECACA",
    iconPath: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
  },
];

// ─── Main page ─────────────────────────────────────────────────────────────────

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "A";

  const activeItem = SIDEBAR_ITEMS.find((i) => i.id === activeTab)!;

  const content: Record<Tab, React.ReactNode> = {
    overview: <OverviewTab />,
    requests: <RequestsTab />,
    offers: <OffersTab />,
    users: <UsersTab />,
    donations: <DonationsTab />,
    disbursements: <DisbursementsTab />,
  };

  const handleTabSelect = (id: Tab) => {
    setActiveTab(id);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: "#f0f6ff" }}>

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 shrink-0 flex flex-col
          bg-white border-r border-gray-100
          transition-transform duration-300 ease-in-out
          ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{ boxShadow: "1px 0 0 0 #f1f5f9, 4px 0 24px -4px rgba(15,23,42,0.07)" }}
      >
        {/* Brand */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <Link
            to="/"
            className="flex items-center gap-2.5 group mb-3.5"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <img src="/logo.png" alt="CommunityAid" className="h-8 w-8 object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-105" />
            <span className="select-none" style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
              <span style={{ fontFamily: "system-ui, sans-serif", fontWeight: 500, fontSize: "17px", letterSpacing: "-0.5px", color: "#0f172a" }}>Community</span>
              <span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700, fontSize: "18px", letterSpacing: "-0.5px", color: "#185FA5" }}>Aid</span>
              <span aria-hidden="true" style={{ width: "5px", height: "5px", borderRadius: "999px", background: "#185FA5", alignSelf: "flex-start", marginTop: "5px", marginLeft: "1px", flexShrink: 0 }} />
            </span>
          </Link>
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
            style={{ background: "#EFF6FF", color: "#185FA5", border: "1px solid #BFDBFE" }}
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Admin Console
          </div>
        </div>

        {/* Nav */}
        <p className="px-5 pt-4 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Menu</p>
        <nav className="flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 text-left group ${
                  isActive ? "font-semibold shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium"
                }`}
                style={isActive ? { background: item.bg, color: item.color, border: `1px solid ${item.border}` } : {}}
              >
                {/* Icon */}
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150 ${isActive ? "" : "bg-slate-50 group-hover:bg-slate-100"}`}
                  style={isActive ? { background: item.color } : {}}
                >
                  <svg
                    className="h-4 w-4"
                    style={{ color: isActive ? "#fff" : undefined }}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={item.iconPath} />
                  </svg>
                </div>
                <div className="flex-1 leading-tight min-w-0">
                  <p className="truncate">{item.label}</p>
                  <p
                    className="text-[10px] font-normal leading-tight truncate mt-0.5"
                    style={{ color: isActive ? item.color : undefined, opacity: isActive ? 0.7 : 1 }}
                  >
                    {item.subtitle}
                  </p>
                </div>
                {isActive && <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: item.color }} />}
              </button>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4" />

        {/* Back to site */}
        <div className="px-3 py-3">
          <Link
            to="/"
            onClick={() => setMobileSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all duration-150 group"
          >
            <div className="h-8 w-8 rounded-lg bg-slate-50 group-hover:bg-slate-100 flex items-center justify-center shrink-0 transition-colors">
              <svg className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </div>
            Back to Site
          </Link>
        </div>

        {/* Admin user */}
        {user?.full_name && (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-3 rounded-xl px-3 py-3 border border-gray-100 bg-slate-50">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shadow-sm ring-2 ring-blue-100 shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 leading-tight truncate">{user.full_name}</p>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5">Administrator</p>
              </div>
              <div className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" title="Online" />
            </div>
          </div>
        )}
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <div
          className="flex items-center gap-4 px-5 py-3.5 shrink-0 border-b border-gray-100 bg-white"
          style={{ boxShadow: "0 1px 0 0 #f1f5f9" }}
        >
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm shrink-0"
            aria-label="Open menu"
          >
            <svg className="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
            </svg>
          </button>

          {/* Page title */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: activeItem.bg }}
            >
              <svg className="h-4 w-4" style={{ color: activeItem.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={activeItem.iconPath} />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-slate-900 leading-tight truncate">{activeItem.label}</p>
              <p className="text-[11px] text-slate-400 leading-tight truncate">{activeItem.subtitle}</p>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
            <span>Admin</span>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <span className="font-semibold text-slate-700">{activeItem.label}</span>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-8">
          {content[activeTab]}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
