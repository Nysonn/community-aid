import apiClient from "./client";
import type {
  Offer,
  User,
  EmergencyRequest,
  Donation,
  Disbursement,
  DashboardStats,
  CreateDonationInput,
} from "../types";

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await apiClient.get("/admin/stats");
  return response.data.data;
}

export async function getAllRequestsAdmin(filters?: {
  type?: string;
  status?: string;
  location_name?: string;
  page?: number;
  page_size?: number;
}): Promise<EmergencyRequest[]> {
  const response = await apiClient.get("/admin/requests", { params: filters });
  return response.data.data;
}

export async function getAllOffersAdmin(params?: {
  page?: number;
  page_size?: number;
}): Promise<Offer[]> {
  const response = await apiClient.get("/admin/offers", { params });
  return response.data.data;
}

// Alias used by MapPage
export const adminGetAllOffers = getAllOffersAdmin;

export async function getAllUsersAdmin(params?: {
  page?: number;
  page_size?: number;
}): Promise<User[]> {
  const response = await apiClient.get("/admin/users", { params });
  return response.data.data;
}

export async function activateUser(id: string): Promise<User> {
  const response = await apiClient.put(`/admin/users/${id}/activate`);
  return response.data.data;
}

export async function deactivateUser(id: string): Promise<User> {
  const response = await apiClient.put(`/admin/users/${id}/deactivate`);
  return response.data.data;
}

export async function createDonation(data: CreateDonationInput): Promise<Donation> {
  const response = await apiClient.post("/admin/donations", data);
  return response.data.data;
}

export async function getDonationsByRequestId(requestId: string): Promise<Donation[]> {
  const response = await apiClient.get(`/admin/donations/${requestId}`);
  return response.data.data;
}

export async function getAllDonations(params?: {
  page?: number;
  page_size?: number;
}): Promise<Donation[]> {
  const response = await apiClient.get("/admin/donations", { params });
  return response.data.data;
}

export async function getAllDisbursements(params?: {
  status?: "pending" | "disbursed";
  page?: number;
  page_size?: number;
}): Promise<Disbursement[]> {
  const response = await apiClient.get("/admin/disbursements", { params });
  return response.data.data;
}

export async function markDisbursed(id: string): Promise<Disbursement> {
  const response = await apiClient.post(`/admin/disbursements/${id}/disburse`);
  return response.data.data;
}

export async function promoteToAdmin(id: string): Promise<User> {
  const response = await apiClient.put(`/admin/users/${id}/promote`);
  return response.data.data;
}

export async function demoteFromAdmin(id: string): Promise<User> {
  const response = await apiClient.put(`/admin/users/${id}/demote`);
  return response.data.data;
}
