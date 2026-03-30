import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getOffersByRequestId,
  createOffer,
  updateOfferStatus,
} from "../api/offers";
import { useGlobalToast } from "../components/layout/Layout";
import type { CreateOfferInput, UpdateOfferStatusInput } from "../types";

type ApiError = Error & { status?: number };

export function useOffersByRequest(requestId: string | undefined) {
  return useQuery({
    queryKey: ["offers", requestId],
    queryFn: () => getOffersByRequestId(requestId!),
    enabled: !!requestId,
  });
}

export function useCreateOffer() {
  const queryClient = useQueryClient();
  const { showToast } = useGlobalToast();

  return useMutation({
    mutationFn: (data: CreateOfferInput) => createOffer(data),
    onSuccess: (offer) => {
      queryClient.invalidateQueries({ queryKey: ["offers", offer.request_id] });
      queryClient.invalidateQueries({ queryKey: ["request", offer.request_id] });
      showToast(
        "Thank you for your offer! The requester will be in touch.",
        "success"
      );
    },
    onError: (err: ApiError) => {
      if (err.status === 400) {
        showToast(
          err.message ||
            "This offer could not be submitted. Approved requests only, and name, contact, and offer type are required.",
          "error"
        );
        return;
      }

      if (err.status === 404) {
        showToast(
          "That request could not be found. Refresh the page and try again.",
          "error"
        );
        return;
      }

      if (err.status === 500) {
        showToast(
          "The server could not save your offer right now. Please try again shortly.",
          "error"
        );
        return;
      }

      // Network error (no status) — component-level onError will handle queuing
      if (!err.status) return;

      showToast(
        err.message || "Failed to submit offer. Please try again.",
        "error"
      );
    },
  });
}

export function useUpdateOfferStatus() {
  const queryClient = useQueryClient();
  const { showToast } = useGlobalToast();

  return useMutation({
    mutationFn: ({
      offerId,
      status,
    }: {
      offerId: string;
      status: UpdateOfferStatusInput["status"];
    }) =>
      updateOfferStatus(offerId, status),
    onSuccess: (offer) => {
      queryClient.invalidateQueries({ queryKey: ["offers", offer.request_id] });
      queryClient.invalidateQueries({ queryKey: ["admin-offers"] });
      showToast("Offer status updated.", "success");
    },
    onError: (err: ApiError) => {
      showToast(
        err.message || "Failed to update offer status. Please try again.",
        "error"
      );
    },
  });
}
