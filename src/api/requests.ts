import apiClient from "./client";
import type {
  CreateRequestInput,
  EmergencyRequest,
  UpdateRequestInput,
} from "../types";

function extractResponseData<T>(payload: unknown): T {
  if (payload && typeof payload === "object") {
    const candidate = payload as Record<string, unknown>;

    if (candidate.data !== undefined) {
      return candidate.data as T;
    }

    if (candidate.request !== undefined) {
      return candidate.request as T;
    }
  }

  return payload as T;
}

function buildCreateRequestFormData(input: CreateRequestInput): FormData {
  const formData = new FormData();

  formData.append("title", input.title.trim());
  formData.append("description", input.description.trim());
  formData.append("type", input.type);
  formData.append("location_name", input.location_name.trim());

  if (input.latitude !== undefined && input.latitude !== null && input.latitude !== "") {
    formData.append("latitude", String(input.latitude));
  }

  if (input.longitude !== undefined && input.longitude !== null && input.longitude !== "") {
    formData.append("longitude", String(input.longitude));
  }

  input.media?.forEach((file) => {
    formData.append("media", file);
  });

  return formData;
}

export async function getAllRequests(filters?: {
  type?: string;
  status?: string;
  location_name?: string;
  page?: number;
  page_size?: number;
}): Promise<EmergencyRequest[]> {
  const response = await apiClient.get("/requests", { params: filters });
  return extractResponseData<EmergencyRequest[]>(response.data);
}

export async function getRequestById(id: string): Promise<EmergencyRequest> {
  const response = await apiClient.get(`/requests/${id}`);
  return extractResponseData<EmergencyRequest>(response.data);
}

export async function getMyRequests(): Promise<EmergencyRequest[]> {
  const response = await apiClient.get("/requests/me");
  return extractResponseData<EmergencyRequest[]>(response.data);
}

export async function createRequest(
  data: CreateRequestInput | FormData
): Promise<EmergencyRequest> {
  const payload = data instanceof FormData ? data : buildCreateRequestFormData(data);
  const response = await apiClient.post("/requests", payload);
  return extractResponseData<EmergencyRequest>(response.data);
}

export async function updateRequest(
  id: string,
  data: Partial<UpdateRequestInput>
): Promise<EmergencyRequest> {
  const response = await apiClient.put(`/requests/${id}`, data);
  return extractResponseData<EmergencyRequest>(response.data);
}

export async function deleteRequest(id: string): Promise<void> {
  await apiClient.delete(`/requests/${id}`);
}

export async function approveRequest(id: string): Promise<EmergencyRequest> {
  const response = await apiClient.post(`/requests/${id}/approve`);
  return extractResponseData<EmergencyRequest>(response.data);
}

export async function rejectRequest(id: string): Promise<EmergencyRequest> {
  const response = await apiClient.post(`/requests/${id}/reject`);
  return extractResponseData<EmergencyRequest>(response.data);
}
