import apiClient from "./client";
import type {
  Offer,
  User,
  EmergencyRequest,
  Donation,
  DashboardStats,
  CreateDonationInput,
} from "../types";

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await apiClient.get("/admin/stats");
  return response.data;
}

export async function getAllRequestsAdmin(filters?: {
  type?: string;
  status?: string;
  location_name?: string;
}): Promise<EmergencyRequest[]> {
  const response = await apiClient.get("/admin/requests", { params: filters });
  return response.data;
}

export async function getAllOffersAdmin(): Promise<Offer[]> {
  const response = await apiClient.get("/admin/offers");
  return response.data;
}

// Alias used by MapPage
export const adminGetAllOffers = getAllOffersAdmin;

export async function getAllUsersAdmin(): Promise<User[]> {
  const response = await apiClient.get("/admin/users");
  return response.data;
}

export async function activateUser(id: string): Promise<User> {
  const response = await apiClient.put(`/admin/users/${id}/activate`);
  return response.data;
}

export async function deactivateUser(id: string): Promise<User> {
  const response = await apiClient.put(`/admin/users/${id}/deactivate`);
  return response.data;
}

export async function createDonation(data: CreateDonationInput): Promise<Donation> {
  const response = await apiClient.post("/admin/donations", data);
  return response.data;
}

export async function getDonationsByRequestId(requestId: string): Promise<Donation[]> {
  const response = await apiClient.get(`/admin/donations/${requestId}`);
  return response.data;
}

export async function getAllDonations(): Promise<Donation[]> {
  const response = await apiClient.get("/admin/donations");
  return response.data;
}
