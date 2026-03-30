import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllRequests,
  getRequestById,
  getMyRequests,
  createRequest,
  updateRequest,
  deleteRequest,
  approveRequest,
  rejectRequest,
} from "../api/requests";
import { useGlobalToast } from "../components/layout/Layout";
import type { CreateRequestInput, UpdateRequestInput } from "../types";

type ApiError = Error & { status?: number };

interface RequestFilters {
  type?: string;
  status?: string;
  location_name?: string;
  page?: number;
  page_size?: number;
}

export function useRequests(filters?: RequestFilters) {
  return useQuery({
    queryKey: ["requests", filters],
    queryFn: () => getAllRequests(filters),
    staleTime: 30_000,
    retry: false,
  });
}

export function useRequest(id: string | undefined) {
  return useQuery({
    queryKey: ["request", id],
    queryFn: () => getRequestById(id!),
    enabled: !!id,
  });
}

export function useMyRequests() {
  return useQuery({
    queryKey: ["my-requests"],
    queryFn: getMyRequests,
    retry: false,
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  const { showToast } = useGlobalToast();

  return useMutation({
    mutationFn: (data: CreateRequestInput) => createRequest(data),
    onSuccess: (createdRequest) => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
      showToast(
        `"${createdRequest.title}" was submitted successfully and is pending admin approval.`,
        "success"
      );
    },
    onError: (err: ApiError) => {
      if (err.status === 400) {
        showToast(
          err.message ||
            "Could not submit the request. Check the title, description, type, and location fields.",
          "error"
        );
        return;
      }

      if (err.status === 401) {
        showToast(
          "Your session has expired. Sign in again, then submit the request.",
          "error"
        );
        return;
      }

      if (err.status === 500) {
        showToast(
          "The server could not save your request right now. Please try again in a moment.",
          "error"
        );
        return;
      }

      // Network error (no status) — component-level onError will handle queuing
      if (!err.status) return;

      showToast(
        err.message || "Failed to submit request. Please try again.",
        "error"
      );
    },
  });
}

export function useUpdateRequest() {
  const queryClient = useQueryClient();
  const { showToast } = useGlobalToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UpdateRequestInput> }) =>
      updateRequest(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["request", updated.id] });
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
      showToast("Request updated successfully.", "success");
    },
    onError: (err: Error) => {
      showToast(
        err.message || "Failed to update request. Please try again.",
        "error"
      );
    },
  });
}

export function useDeleteRequest() {
  const queryClient = useQueryClient();
  const { showToast } = useGlobalToast();

  return useMutation({
    mutationFn: (id: string) => deleteRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
      showToast("Request deleted.", "info");
    },
    onError: (err: Error) => {
      showToast(
        err.message || "Failed to delete request. Please try again.",
        "error"
      );
    },
  });
}

export function useApproveRequest() {
  const queryClient = useQueryClient();
  const { showToast } = useGlobalToast();

  return useMutation({
    mutationFn: (id: string) => approveRequest(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["request", updated.id] });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
      showToast("Request approved.", "success");
    },
    onError: (err: Error) => {
      showToast(
        err.message || "Failed to approve request. Please try again.",
        "error"
      );
    },
  });
}

export function useRejectRequest() {
  const queryClient = useQueryClient();
  const { showToast } = useGlobalToast();

  return useMutation({
    mutationFn: (id: string) => rejectRequest(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["request", updated.id] });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
      showToast("Request rejected.", "info");
    },
    onError: (err: Error) => {
      showToast(
        err.message || "Failed to reject request. Please try again.",
        "error"
      );
    },
  });
}
