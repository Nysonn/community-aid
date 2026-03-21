import apiClient from "./client";
import type { User, UpdateUserInput } from "../types";

export async function getMe(): Promise<User> {
  const response = await apiClient.get("/users/me");
  return response.data;
}

export async function updateMe(data: UpdateUserInput): Promise<User> {
  const response = await apiClient.put("/users/me", data);
  return response.data;
}

export async function uploadProfileImage(
  file: File
): Promise<{ profileImageUrl: string }> {
  const formData = new FormData();
  formData.append("avatar", file);
  const response = await apiClient.post("/users/me/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}
