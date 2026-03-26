import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getOffersByRequestId,
  createOffer,
  updateOfferStatus,
} from "../api/offers";
import { useGlobalToast } from "../components/layout/Layout";
import type { CreateOfferInput } from "../types";

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
      showToast(
        "Thank you for your offer! The requester will be in touch.",
        "success"
      );
    },
    onError: (err: Error) => {
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
    mutationFn: ({ offerId, status }: { offerId: string; status: string }) =>
      updateOfferStatus(offerId, status),
    onSuccess: (offer) => {
      queryClient.invalidateQueries({ queryKey: ["offers", offer.request_id] });
      queryClient.invalidateQueries({ queryKey: ["admin-offers"] });
      showToast("Offer status updated.", "success");
    },
    onError: (err: Error) => {
      showToast(
        err.message || "Failed to update offer status. Please try again.",
        "error"
      );
    },
  });
}
