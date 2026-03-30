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
} from "../hooks/useAdmin";
import { useApproveRequest, useRejectRequest } from "../hooks/useRequests";
import { useUpdateOfferStatus } from "../hooks/useOffers";
import RequestDetailModal from "../components/requests/RequestDetailModal";
import type { Offer } from "../types";

// ─── Shared helpers ────────────────────────────────────────────────────────────

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

function Badge({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${className}`}
    >
      {label}
    </span>
  );
}

// ─── Table wrapper ──────────────────────────────────────────────────────────────

function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-card">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

function THead({ columns }: { columns: string[] }) {
  return (
    <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider border-b border-gray-100">
      <tr>
        {columns.map((col) => (
          <th key={col} className="px-4 py-3.5 text-left font-semibold whitespace-nowrap">
            {col}
          </th>
        ))}
      </tr>
    </thead>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function StatSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-card">
          <div className="h-3 bg-gray-100 rounded-full w-3/4 mb-4" />
          <div className="h-7 bg-gray-100 rounded-full w-1/2" />
        </div>
      ))}
    </div>
  );
}

function TableRowSkeleton({ cols }: { cols: number[] }) {
  return (
    <tr className="border-b border-gray-50">
      {cols.map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className={`h-3.5 bg-gray-100 rounded-full animate-pulse w-${w}/12`} />
        </td>
      ))}
    </tr>
  );
}

// ─── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-shadow duration-200">
      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">{label}</p>
      <p className="text-2xl font-extrabold text-slate-900">{value}</p>
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
  return (
    <div className="flex flex-wrap gap-2.5 mb-5 items-center">
      <select
        value={typeFilter}
        onChange={(e) => onType(e.target.value)}
        className="border border-gray-200 rounded-xl px-3.5 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
      >
        <option value="">All Types</option>
        {REQUEST_TYPES.map((t) => (
          <option key={t} value={t} className="capitalize">
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </option>
        ))}
      </select>
      <select
        value={statusFilter}
        onChange={(e) => onStatus(e.target.value)}
        className="border border-gray-200 rounded-xl px-3.5 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
      >
        <option value="">All Statuses</option>
        {REQUEST_STATUSES.map((s) => (
          <option key={s} value={s} className="capitalize">
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M16.65 10a6.65 6.65 0 11-13.3 0 6.65 6.65 0 0113.3 0z" />
          </svg>
        </span>
        <input
          type="text"
          value={locationFilter}
          onChange={(e) => onLocation(e.target.value)}
          placeholder="Search by location"
          className="border border-gray-200 rounded-xl pl-9 pr-3.5 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm w-48"
        />
      </div>
      {hasFilters && (
        <button
          onClick={onClear}
          className="text-sm text-slate-400 hover:text-slate-600 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
        >
          Clear
        </button>
      )}
    </div>
  );
}

// ─── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab() {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) return <StatSkeleton />;
  if (!stats) return <p className="text-gray-500">Failed to load stats.</p>;

  const cards: { label: string; value: string | number }[] = [
    { label: "Total Community Members", value: stats.total_users },
    { label: "Active Members", value: stats.active_users },
    { label: "Total Requests", value: stats.total_requests },
    { label: "Pending Requests", value: stats.pending_requests },
    { label: "Approved Requests", value: stats.approved_requests },
    { label: "Rejected Requests", value: stats.rejected_requests },
    { label: "Total Offers", value: stats.total_offers },
    { label: "Fulfilled Offers", value: stats.fulfilled_offers },
    { label: "Total Donations", value: stats.total_donations },
    { label: "Total Amount Donated", value: formatUGX(stats.total_donation_amount) },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <StatCard key={c.label} label={c.label} value={c.value} />
      ))}
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
      <h2 className="text-lg font-semibold text-gray-900 mb-4">All Requests</h2>
      <RequestFilters
        typeFilter={typeFilter}
        statusFilter={statusFilter}
        locationFilter={locationFilter}
        onType={setTypeFilter}
        onStatus={setStatusFilter}
        onLocation={setLocationFilter}
        onClear={() => {
          setTypeFilter("");
          setStatusFilter("");
          setLocationFilter("");
        }}
      />
      {isLoading ? (
        <TableWrap>
          <THead columns={["Title", "Type", "Status", "Location", "Posted By", "Date", "Actions"]} />
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRowSkeleton key={i} cols={[6, 3, 3, 4, 3, 4, 3]} />
            ))}
          </tbody>
        </TableWrap>
      ) : requests.length === 0 ? (
        <p className="text-gray-400 text-sm py-8 text-center">No requests found.</p>
      ) : (
        <TableWrap>
          <THead
            columns={["Title", "Type", "Status", "Location", "Posted By", "Date", "Actions"]}
          />
          <tbody className="divide-y divide-gray-50 bg-white">
            {requests.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3.5 max-w-[180px] truncate font-semibold text-slate-900">
                  {r.title}
                </td>
                <td className="px-4 py-3.5">
                  <Badge label={r.type} className={TYPE_BADGE[r.type]} />
                </td>
                <td className="px-4 py-3.5">
                  <Badge label={r.status} className={STATUS_BADGE[r.status]} />
                </td>
                <td className="px-4 py-3.5 text-slate-500 max-w-[140px] truncate">
                  {r.location_name}
                </td>
                <td className="px-4 py-3.5 text-slate-400 font-mono text-xs">
                  {r.user_id.slice(0, 8)}…
                </td>
                <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap text-xs">
                  {formatDate(r.created_at)}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    {r.status === "pending" && (
                      <>
                        <button
                          onClick={() => approveMutation.mutate(r.id)}
                          disabled={approveMutation.isPending && approveMutation.variables === r.id}
                          className="px-3 py-1 text-xs font-semibold text-white bg-emerald-600 rounded-full hover:bg-emerald-700 disabled:opacity-50 transition-all"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectMutation.mutate(r.id)}
                          disabled={rejectMutation.isPending && rejectMutation.variables === r.id}
                          className="px-3 py-1 text-xs font-semibold text-white bg-red-600 rounded-full hover:bg-red-700 disabled:opacity-50 transition-all"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setSelectedRequestId(r.id)}
                      className="px-3 py-1 text-xs font-semibold border border-gray-200 rounded-full hover:bg-gray-50 transition-all text-slate-600"
                    >
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
      <RequestDetailModal
        requestId={selectedRequestId}
        onClose={() => setSelectedRequestId(null)}
      />
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
      <h2 className="text-lg font-semibold text-gray-900 mb-4">All Offers</h2>
      {isLoading ? (
        <TableWrap>
          <THead columns={["Responder", "Contact", "Offer Type", "Status", "Linked Request", "Date", "Actions"]} />
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRowSkeleton key={i} cols={[4, 5, 3, 3, 2, 4, 3]} />
            ))}
          </tbody>
        </TableWrap>
      ) : offers.length === 0 ? (
        <p className="text-gray-400 text-sm py-8 text-center">No offers found.</p>
      ) : (
        <TableWrap>
          <THead
            columns={[
              "Responder",
              "Contact",
              "Offer Type",
              "Status",
              "Linked Request",
              "Date",
              "Actions",
            ]}
          />
          <tbody className="divide-y divide-gray-50 bg-white">
            {offers.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3.5 font-semibold text-slate-900">
                  {o.responder_name}
                </td>
                <td className="px-4 py-3.5 text-slate-500">{o.responder_contact}</td>
                <td className="px-4 py-3.5">
                  <Badge
                    label={o.offer_type}
                    className={OFFER_TYPE_BADGE[o.offer_type]}
                  />
                </td>
                <td className="px-4 py-3.5">
                  <Badge
                    label={o.status}
                    className={OFFER_STATUS_BADGE[o.status]}
                  />
                </td>
                <td className="px-4 py-3.5">
                  <button
                    onClick={() => setSelectedRequestId(o.request_id)}
                    title="View linked request"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </td>
                <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap text-xs">
                  {formatDate(o.created_at)}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    {o.status === "pending" && (
                      <button
                        onClick={() => offerStatusMutation.mutate({ offerId: o.id, status: "accepted" })}
                        disabled={offerStatusMutation.isPending}
                        className="px-3 py-1 text-xs font-semibold text-white bg-emerald-600 rounded-full hover:bg-emerald-700 disabled:opacity-50 transition-all"
                      >
                        Accept
                      </button>
                    )}
                    {o.status === "accepted" && (
                      <button
                        onClick={() => offerStatusMutation.mutate({ offerId: o.id, status: "fulfilled" })}
                        disabled={offerStatusMutation.isPending}
                        className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded-full hover:bg-blue-700 disabled:opacity-50 transition-all"
                      >
                        Mark Fulfilled
                      </button>
                    )}
                    {o.status === "fulfilled" && (
                      <span className="px-3 py-1 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full">
                        Completed
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
      <RequestDetailModal
        requestId={selectedRequestId}
        onClose={() => setSelectedRequestId(null)}
      />
    </div>
  );
}

// ─── Users Tab ─────────────────────────────────────────────────────────────────

function UsersTab() {
  const { data: allUsers = [], isLoading } = useAdminUsers();
  const users = allUsers.filter((u) => u.role !== "admin");
  const activateMutation = useActivateUser();
  const deactivateMutation = useDeactivateUser();

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Community Members
      </h2>
      {isLoading ? (
        <TableWrap>
          <THead columns={["Full Name", "Email", "Phone", "Status", "Joined", "Actions"]} />
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRowSkeleton key={i} cols={[4, 5, 4, 3, 4, 3]} />
            ))}
          </tbody>
        </TableWrap>
      ) : users.length === 0 ? (
        <p className="text-gray-400 text-sm py-8 text-center">
          No community members found.
        </p>
      ) : (
        <TableWrap>
          <THead
            columns={[
              "Full Name",
              "Email",
              "Phone",
              "Status",
              "Joined",
              "Actions",
            ]}
          />
          <tbody className="divide-y divide-gray-50 bg-white">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3.5 font-semibold text-slate-900">
                  {u.full_name}
                </td>
                <td className="px-4 py-3.5 text-slate-500">{u.email}</td>
                <td className="px-4 py-3.5 text-slate-500">{u.phone_number}</td>
                <td className="px-4 py-3.5">
                  <Badge
                    label={u.is_active ? "Active" : "Inactive"}
                    className={
                      u.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }
                  />
                </td>
                <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap text-xs">
                  {formatDate(u.created_at)}
                </td>
                <td className="px-4 py-3.5">
                  {u.is_active ? (
                    <button
                      onClick={() => deactivateMutation.mutate(u.id)}
                      disabled={
                        deactivateMutation.isPending &&
                        deactivateMutation.variables === u.id
                      }
                      className="px-3 py-1 text-xs font-semibold text-white bg-red-600 rounded-full hover:bg-red-700 disabled:opacity-50 transition-all"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => activateMutation.mutate(u.id)}
                      disabled={
                        activateMutation.isPending &&
                        activateMutation.variables === u.id
                      }
                      className="px-3 py-1 text-xs font-semibold text-white bg-emerald-600 rounded-full hover:bg-emerald-700 disabled:opacity-50 transition-all"
                    >
                      Activate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </div>
  );
}

// ─── Donations Tab ─────────────────────────────────────────────────────────────

function DonationsTab() {
  const { data: donations = [], isLoading: donationsLoading } = useAdminDonations();
  const { data: allRequests = [] } = useAdminRequests();
  const requestTitleMap = new Map(allRequests.map((r) => [r.id, r.title]));

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">All Donations</h2>
        {donationsLoading ? (
          <TableWrap>
            <THead columns={["Donor Name", "Amount", "Request", "Date"]} />
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} cols={[4, 3, 6, 4]} />
              ))}
            </tbody>
          </TableWrap>
        ) : donations.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">
            No donations recorded yet.
          </p>
        ) : (
          <TableWrap>
            <THead columns={["Donor Name", "Amount", "Request", "Date"]} />
            <tbody className="divide-y divide-gray-50 bg-white">
              {donations.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3.5 font-semibold text-slate-900">
                    {d.donor_name}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-700">
                    {formatUGX(d.amount)}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 max-w-[200px] truncate">
                    {requestTitleMap.get(d.request_id) ?? (
                      <span className="font-mono text-xs text-slate-400">
                        {d.request_id.slice(0, 8)}…
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap text-xs">
                    {formatDate(d.date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

type Tab = "overview" | "requests" | "offers" | "users" | "donations";

const SIDEBAR_ITEMS: {
  id: Tab;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "overview",
    label: "Overview",
    subtitle: "Stats at a glance",
    icon: (
      <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: "requests",
    label: "Requests",
    subtitle: "Review & approve",
    icon: (
      <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: "offers",
    label: "Offers",
    subtitle: "Responder activity",
    icon: (
      <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    id: "users",
    label: "Members",
    subtitle: "Manage community",
    icon: (
      <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: "donations",
    label: "Donations",
    subtitle: "Track donations",
    icon: (
      <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "A";

  const activeItem = SIDEBAR_ITEMS.find((i) => i.id === activeTab)!;

  const content = {
    overview: <OverviewTab />,
    requests: <RequestsTab />,
    offers: <OffersTab />,
    users: <UsersTab />,
    donations: <DonationsTab />,
  }[activeTab];

  const handleTabSelect = (id: Tab) => {
    setActiveTab(id);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-[#F8F9FB]">

      {/* ── Mobile overlay backdrop ── */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 shrink-0
          bg-white border-r border-gray-100
          shadow-[1px_0_0_0_rgba(0,0,0,0.04),4px_0_24px_-4px_rgba(0,0,0,0.06)]
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Brand */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <Link
            to="/"
            className="flex items-center gap-2.5 group mb-3"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <img
              src="/logo.png"
              alt="CommunityAid"
              className="h-8 w-8 object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
            />
            <span className="select-none" style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
              <span style={{ fontFamily: "system-ui, sans-serif", fontWeight: 500, fontSize: "18px", letterSpacing: "-0.5px" }}>Community</span>
              <span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700, fontSize: "20px", letterSpacing: "-0.5px", color: "#185FA5" }}>Aid</span>
              <span aria-hidden="true" style={{ width: "5px", height: "5px", borderRadius: "999px", background: "#185FA5", alignSelf: "flex-start", marginTop: "6px", marginLeft: "1px", flexShrink: 0 }} />
            </span>
          </Link>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
            style={{ background: "#EFF6FF", color: "#185FA5", border: "1px solid #bfdbfe" }}
          >
            <span style={{ width: "5px", height: "5px", borderRadius: "999px", background: "#185FA5", flexShrink: 0, display: "inline-block" }} />
            Admin Console
          </span>
        </div>

        {/* Nav label */}
        <p className="px-5 pt-4 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Navigation
        </p>

        {/* Nav items */}
        <nav className="flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 text-left group ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium"
                }`}
              >
                <span className={`shrink-0 transition-colors ${isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`}>
                  {item.icon}
                </span>
                <span className="flex-1 leading-tight">{item.label}</span>
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4" />

        {/* Bottom: back to site */}
        <div className="px-3 py-3">
          <Link
            to="/"
            onClick={() => setMobileSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all duration-150 group"
          >
            <svg className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Site
          </Link>
        </div>

        {/* Admin user */}
        {user?.full_name && (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5 border border-gray-100">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shadow-sm ring-2 ring-blue-100 shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 leading-tight truncate">{user.full_name}</p>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5">Administrator</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 bg-white border-b border-gray-100 px-4 py-3.5 shrink-0">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm"
            aria-label="Open menu"
          >
            <svg className="h-3.5 w-3.5 text-slate-600" fill="none" viewBox="0 0 16 12" stroke="currentColor">
              <line x1="0" y1="1"  x2="16" y2="1"  strokeWidth="1.75" strokeLinecap="round" />
              <line x1="2" y1="6"  x2="14" y2="6"  strokeWidth="1.75" strokeLinecap="round" />
              <line x1="0" y1="11" x2="16" y2="11" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-tight">{activeItem.label}</p>
            <p className="text-[11px] text-slate-400 leading-tight">{activeItem.subtitle}</p>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-8">
          {content}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
