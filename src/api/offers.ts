import apiClient from "./client";
import type { Offer, CreateOfferInput } from "../types";

export type { CreateOfferInput };

export async function getOffersByRequestId(requestId: string): Promise<Offer[]> {
  const response = await apiClient.get(`/offers/request/${requestId}`);
  return response.data;
}

export async function getOffersByRequest(requestId: string): Promise<Offer[]> {
  const response = await apiClient.get("/offers", { params: { requestId } });
  return response.data;
}

export async function createOffer(data: CreateOfferInput): Promise<Offer> {
  const response = await apiClient.post("/offers", data);
  return response.data;
}

export async function updateOfferStatus(
  id: string,
  status: string
): Promise<Offer> {
  const response = await apiClient.put(`/offers/${id}/status`, { status });
  return response.data;
}
