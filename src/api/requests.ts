import apiClient from "./client";
import type { EmergencyRequest } from "../types";

export interface UpdateRequestInput {
  title: string;
  description: string;
  type: "medical" | "food" | "rescue" | "shelter";
  locationName: string;
  latitude?: number;
  longitude?: number;
}

export async function getAllRequests(filters?: {
  type?: string;
  status?: string;
  location_name?: string;
}): Promise<EmergencyRequest[]> {
  const response = await apiClient.get("/requests", { params: filters });
  return response.data;
}

export async function getRequestById(id: string): Promise<EmergencyRequest> {
  const response = await apiClient.get(`/requests/${id}`);
  return response.data;
}

export async function getMyRequests(): Promise<EmergencyRequest[]> {
  const response = await apiClient.get("/requests/me");
  return response.data;
}

export async function createRequest(data: FormData): Promise<EmergencyRequest> {
  // Do NOT set Content-Type manually for FormData. Axios/the browser must set
  // it automatically so the multipart boundary is included in the header, e.g.:
  //   Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
  // A hardcoded "multipart/form-data" header omits the boundary, which makes
  // the backend unable to parse the request body.
  const response = await apiClient.post("/requests", data);
  return response.data;
}

export async function updateRequest(
  id: string,
  data: Partial<UpdateRequestInput>
): Promise<EmergencyRequest> {
  const response = await apiClient.put(`/requests/${id}`, data);
  return response.data;
}

export async function approveRequest(id: string): Promise<EmergencyRequest> {
  const response = await apiClient.post(`/requests/${id}/approve`);
  return response.data;
}

export async function rejectRequest(id: string): Promise<EmergencyRequest> {
  const response = await apiClient.post(`/requests/${id}/reject`);
  return response.data;
}
