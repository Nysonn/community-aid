import apiClient from "./client";
import type { EmergencyRequest, UpdateRequestInput } from "../types";

export async function getAllRequests(filters?: {
  type?: string;
  status?: string;
  location_name?: string;
  page?: number;
  page_size?: number;
}): Promise<EmergencyRequest[]> {
  const response = await apiClient.get("/requests", { params: filters });
  return response.data.data;
}

export async function getRequestById(id: string): Promise<EmergencyRequest> {
  const response = await apiClient.get(`/requests/${id}`);
  return response.data.data;
}

export async function getMyRequests(): Promise<EmergencyRequest[]> {
  const response = await apiClient.get("/requests/me");
  return response.data.data;
}

export async function createRequest(data: FormData): Promise<EmergencyRequest> {
  const response = await apiClient.post("/requests", data);
  return response.data.data;
}

export async function updateRequest(
  id: string,
  data: Partial<UpdateRequestInput>
): Promise<EmergencyRequest> {
  const response = await apiClient.put(`/requests/${id}`, data);
  return response.data.data;
}

export async function deleteRequest(id: string): Promise<void> {
  await apiClient.delete(`/requests/${id}`);
}

export async function approveRequest(id: string): Promise<EmergencyRequest> {
  const response = await apiClient.post(`/requests/${id}/approve`);
  return response.data.data;
}

export async function rejectRequest(id: string): Promise<EmergencyRequest> {
  const response = await apiClient.post(`/requests/${id}/reject`);
  return response.data.data;
}
