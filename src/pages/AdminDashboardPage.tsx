import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDashboardStats,
  getAllRequestsAdmin,
  getAllOffersAdmin,
  getAllUsersAdmin,
  activateUser,
  deactivateUser,
  createDonation,
  getAllDonations,
} from "../api/admin";
import { approveRequest, rejectRequest } from "../api/requests";
import { useGlobalToast } from "../components/layout/Layout";
import { TYPE_BADGE, STATUS_BADGE } from "../components/requests/RequestCard";
import type {
  DashboardStats,
  EmergencyRequest,
  Offer,
  User,
  CreateDonationInput,
} from "../types";

// ─── Shared helpers ────────────────────────────────────────────────────────────

const OFFER_TYPE_BADGE: Record<Offer["offerType"], string> = {
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
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

function THead({ columns }: { columns: string[] }) {
  return (
    <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
      <tr>
        {columns.map((col) => (
          <th key={col} className="px-4 py-3 text-left font-medium whitespace-nowrap">
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
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="h-3 bg-gray-200 rounded w-3/4 mb-3" />
          <div className="h-7 bg-gray-200 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

// ─── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
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
    <div className="flex flex-wrap gap-3 mb-4 items-center">
      <select
        value={typeFilter}
        onChange={(e) => onType(e.target.value)}
        className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Statuses</option>
        {REQUEST_STATUSES.map((s) => (
          <option key={s} value={s} className="capitalize">
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M16.65 10a6.65 6.65 0 11-13.3 0 6.65 6.65 0 0113.3 0z"
            />
          </svg>
        </span>
        <input
          type="text"
          value={locationFilter}
          onChange={(e) => onLocation(e.target.value)}
          placeholder="Search by location"
          className="border border-gray-300 rounded-md pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
        />
      </div>
      {hasFilters && (
        <button
          onClick={onClear}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Clear
        </button>
      )}
    </div>
  );
}

// ─── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["admin-stats"],
    queryFn: getDashboardStats,
    staleTime: 60_000,
  });

  if (isLoading) return <StatSkeleton />;
  if (!stats) return <p className="text-gray-500">Failed to load stats.</p>;

  const cards: { label: string; value: string | number }[] = [
    { label: "Total Community Members", value: stats.totalUsers },
    { label: "Active Members", value: stats.activeUsers },
    { label: "Total Requests", value: stats.totalRequests },
    { label: "Pending Requests", value: stats.pendingRequests },
    { label: "Approved Requests", value: stats.approvedRequests },
    { label: "Rejected Requests", value: stats.rejectedRequests },
    { label: "Total Offers", value: stats.totalOffers },
    { label: "Fulfilled Offers", value: stats.fulfilledOffers },
    { label: "Total Donations", value: stats.totalDonations },
    { label: "Total Amount Donated", value: formatUGX(stats.totalDonationAmount) },
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
  const queryClient = useQueryClient();
  const { showToast } = useGlobalToast();
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const { data: requests = [], isLoading } = useQuery<EmergencyRequest[]>({
    queryKey: ["admin-requests", typeFilter, statusFilter, locationFilter],
    queryFn: () => {
      const filters: Record<string, string> = {};
      if (typeFilter) filters.type = typeFilter;
      if (statusFilter) filters.status = statusFilter;
      if (locationFilter) filters.location_name = locationFilter;
      return getAllRequestsAdmin(Object.keys(filters).length ? filters : undefined);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
      showToast("Request approved.", "success");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
      showToast("Request rejected.", "info");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

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
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <p className="text-gray-400 text-sm py-8 text-center">No requests found.</p>
      ) : (
        <TableWrap>
          <THead
            columns={["Title", "Type", "Status", "Location", "Posted By", "Date", "Actions"]}
          />
          <tbody className="divide-y divide-gray-100 bg-white">
            {requests.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 max-w-[180px] truncate font-medium text-gray-900">
                  {r.title}
                </td>
                <td className="px-4 py-3">
                  <Badge label={r.type} className={TYPE_BADGE[r.type]} />
                </td>
                <td className="px-4 py-3">
                  <Badge label={r.status} className={STATUS_BADGE[r.status]} />
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">
                  {r.locationName}
                </td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                  {r.userId.slice(0, 8)}…
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {formatDate(r.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {r.status === "pending" && (
                      <>
                        <button
                          onClick={() => approveMutation.mutate(r.id)}
                          disabled={
                            approveMutation.isPending &&
                            approveMutation.variables === r.id
                          }
                          className="px-2.5 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectMutation.mutate(r.id)}
                          disabled={
                            rejectMutation.isPending &&
                            rejectMutation.variables === r.id
                          }
                          className="px-2.5 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <a
                      href={`/requests/${r.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 text-xs font-medium border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      View
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </div>
  );
}

// ─── Offers Tab ────────────────────────────────────────────────────────────────

function OffersTab() {
  const { data: offers = [], isLoading } = useQuery<Offer[]>({
    queryKey: ["admin-offers"],
    queryFn: getAllOffersAdmin,
  });

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">All Offers</h2>
      {isLoading ? (
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded" />
          ))}
        </div>
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
            ]}
          />
          <tbody className="divide-y divide-gray-100 bg-white">
            {offers.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {o.responderName}
                </td>
                <td className="px-4 py-3 text-gray-600">{o.responderContact}</td>
                <td className="px-4 py-3">
                  <Badge
                    label={o.offerType}
                    className={OFFER_TYPE_BADGE[o.offerType]}
                  />
                </td>
                <td className="px-4 py-3">
                  <Badge
                    label={o.status}
                    className={OFFER_STATUS_BADGE[o.status]}
                  />
                </td>
                <td className="px-4 py-3">
                  <a
                    href={`/requests/${o.requestId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-blue-600 hover:underline"
                  >
                    {o.requestId.slice(0, 8)}…
                  </a>
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {formatDate(o.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </div>
  );
}

// ─── Users Tab ─────────────────────────────────────────────────────────────────

function UsersTab() {
  const queryClient = useQueryClient();
  const { showToast } = useGlobalToast();

  const { data: allUsers = [], isLoading } = useQuery<User[]>({
    queryKey: ["admin-users"],
    queryFn: getAllUsersAdmin,
  });

  const users = allUsers.filter((u) => u.role !== "admin");

  const activateMutation = useMutation({
    mutationFn: (id: string) => activateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      showToast("User activated.", "success");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      showToast("User deactivated.", "info");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Community Members
      </h2>
      {isLoading ? (
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded" />
          ))}
        </div>
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
          <tbody className="divide-y divide-gray-100 bg-white">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {u.fullName}
                </td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3 text-gray-600">{u.phoneNumber}</td>
                <td className="px-4 py-3">
                  <Badge
                    label={u.isActive ? "Active" : "Inactive"}
                    className={
                      u.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }
                  />
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {formatDate(u.createdAt)}
                </td>
                <td className="px-4 py-3">
                  {u.isActive ? (
                    <button
                      onClick={() => deactivateMutation.mutate(u.id)}
                      disabled={
                        deactivateMutation.isPending &&
                        deactivateMutation.variables === u.id
                      }
                      className="px-2.5 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
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
                      className="px-2.5 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
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
  const queryClient = useQueryClient();
  const { showToast } = useGlobalToast();

  const [requestId, setRequestId] = useState("");
  const [donorName, setDonorName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");

  const { data: donations = [], isLoading: donationsLoading } = useQuery({
    queryKey: ["admin-donations"],
    queryFn: getAllDonations,
  });

  const { data: allRequests = [] } = useQuery({
    queryKey: ["admin-requests-map"],
    queryFn: () => getAllRequestsAdmin(),
    staleTime: 120_000,
  });

  const requestTitleMap = new Map(allRequests.map((r) => [r.id, r.title]));

  const createMutation = useMutation({
    mutationFn: (data: CreateDonationInput) => createDonation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-donations"] });
      showToast("Donation logged successfully.", "success");
      setRequestId("");
      setDonorName("");
      setAmount("");
      setDate("");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      requestId,
      donorName,
      amount: parseFloat(amount),
      date,
    });
  };

  return (
    <div className="space-y-8">
      {/* ── Log a Donation form ── */}
      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">
          Log a Donation
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          Enter the ID of the request this donation is linked to, then fill in
          the donor details.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Request ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Paste the request UUID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Donor Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Full name"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (UGX) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 50000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {createMutation.isPending ? "Logging..." : "Submit"}
          </button>
        </form>
      </section>

      {/* ── All Donations table ── */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          All Donations
        </h2>
        {donationsLoading ? (
          <div className="animate-pulse space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded" />
            ))}
          </div>
        ) : donations.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">
            No donations recorded yet.
          </p>
        ) : (
          <TableWrap>
            <THead columns={["Donor Name", "Amount", "Request", "Date"]} />
            <tbody className="divide-y divide-gray-100 bg-white">
              {donations.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {d.donorName}
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium">
                    {formatUGX(d.amount)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                    {requestTitleMap.get(d.requestId) ?? (
                      <span className="font-mono text-xs text-gray-400">
                        {d.requestId.slice(0, 8)}…
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {formatDate(d.date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </section>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

type Tab = "overview" | "requests" | "offers" | "users" | "donations";

const SIDEBAR_ITEMS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "requests", label: "Requests" },
  { id: "offers", label: "Offers" },
  { id: "users", label: "Users" },
  { id: "donations", label: "Donations" },
];

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const content = {
    overview: <OverviewTab />,
    requests: <RequestsTab />,
    offers: <OffersTab />,
    users: <UsersTab />,
    donations: <DonationsTab />,
  }[activeTab];

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-8rem)]">
      {/* Sidebar / mobile tab bar */}
      <aside className="md:w-56 shrink-0 bg-white border-b md:border-b-0 md:border-r border-gray-200">
        <div className="flex md:flex-col overflow-x-auto md:overflow-visible p-2 md:p-4 gap-1">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium transition-colors text-left ${
                activeTab === item.id
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </aside>

      {/* Content area */}
      <main className="flex-1 p-6 bg-gray-50 overflow-auto">{content}</main>
    </div>
  );
};

export default AdminDashboardPage;
