import apiClient from "./client";
import type { User, RegisterUserInput } from "../types";

export async function registerUser(data: RegisterUserInput): Promise<User> {
  const response = await apiClient.post("/auth/register", data);
  return response.data.data;
}
