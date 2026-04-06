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
  getAllDisbursements,
  markDisbursed,
  promoteToAdmin,
  demoteFromAdmin,
} from "../api/admin";
import { useGlobalToast } from "../components/layout/Layout";
import type { CreateDonationInput } from "../types";

interface AdminRequestFilters {
  type?: string;
  status?: string;
  location_name?: string;
  page?: number;
  page_size?: number;
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: getDashboardStats,
    staleTime: 60_000,
  });
}

export function useAdminRequests(filters?: AdminRequestFilters) {
  return useQuery({
    queryKey: ["admin-requests", filters],
    queryFn: () => getAllRequestsAdmin(filters),
  });
}

export function useAdminOffers() {
  return useQuery({
    queryKey: ["admin-offers"],
    queryFn: () => getAllOffersAdmin(),
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: () => getAllUsersAdmin(),
  });
}

export function useActivateUser() {
  const queryClient = useQueryClient();
  const { showToast } = useGlobalToast();

  return useMutation({
    mutationFn: (id: string) => activateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      showToast("User activated.", "success");
    },
    onError: (err: Error) => {
      showToast(
        err.message || "Failed to activate user. Please try again.",
        "error"
      );
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  const { showToast } = useGlobalToast();

  return useMutation({
    mutationFn: (id: string) => deactivateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      showToast("User deactivated.", "info");
    },
    onError: (err: Error) => {
      showToast(
        err.message || "Failed to deactivate user. Please try again.",
        "error"
      );
    },
  });
}

export function useAdminDonations() {
  return useQuery({
    queryKey: ["admin-donations"],
    queryFn: () => getAllDonations(),
  });
}

export function useCreateDonation() {
  const queryClient = useQueryClient();
  const { showToast } = useGlobalToast();

  return useMutation({
    mutationFn: (data: CreateDonationInput) => createDonation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-donations"] });
      showToast("Donation logged successfully.", "success");
    },
    onError: (err: Error) => {
      showToast(
        err.message || "Failed to log donation. Please try again.",
        "error"
      );
    },
  });
}

export function useAdminDisbursements(status?: "pending" | "disbursed") {
  return useQuery({
    queryKey: ["admin-disbursements", status],
    queryFn: () => getAllDisbursements(status ? { status } : undefined),
  });
}

export function useMarkDisbursed() {
  const queryClient = useQueryClient();
  const { showToast } = useGlobalToast();

  return useMutation({
    mutationFn: (id: string) => markDisbursed(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-disbursements"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      showToast("Funds marked as disbursed. Emails sent.", "success");
    },
    onError: (err: Error) => {
      showToast(err.message || "Failed to disburse funds.", "error");
    },
  });
}

export function usePromoteToAdmin() {
  const queryClient = useQueryClient();
  const { showToast } = useGlobalToast();

  return useMutation({
    mutationFn: (id: string) => promoteToAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      showToast("User promoted to admin.", "success");
    },
    onError: (err: Error) => {
      showToast(err.message || "Failed to promote user.", "error");
    },
  });
}

export function useDemoteFromAdmin() {
  const queryClient = useQueryClient();
  const { showToast } = useGlobalToast();

  return useMutation({
    mutationFn: (id: string) => demoteFromAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      showToast("Admin demoted to community member.", "info");
    },
    onError: (err: Error) => {
      showToast(err.message || "Failed to demote user.", "error");
    },
  });
}
