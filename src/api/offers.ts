import apiClient from "./client";
import type {
  CreateOfferInput,
  Offer,
  UpdateOfferStatusInput,
} from "../types";

export type { CreateOfferInput };

function extractResponseData<T>(payload: unknown): T {
  if (payload && typeof payload === "object") {
    const candidate = payload as Record<string, unknown>;

    if (candidate.data !== undefined) {
      return candidate.data as T;
    }

    if (candidate.offer !== undefined) {
      return candidate.offer as T;
    }
  }

  return payload as T;
}

export async function getOffersByRequestId(requestId: string): Promise<Offer[]> {
  const response = await apiClient.get(`/offers/request/${requestId}`);
  return extractResponseData<Offer[]>(response.data);
}

export async function createOffer(data: CreateOfferInput): Promise<Offer> {
  const response = await apiClient.post("/offers", data);
  return extractResponseData<Offer>(response.data);
}

export async function updateOfferStatus(
  id: string,
  status: UpdateOfferStatusInput["status"]
): Promise<Offer> {
  const response = await apiClient.put(`/offers/${id}/status`, { status });
  return extractResponseData<Offer>(response.data);
}
