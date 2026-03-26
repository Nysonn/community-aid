import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMe, updateMe, uploadProfileImage } from "../api/users";
import { useGlobalToast } from "../components/layout/Layout";
import type { UpdateUserInput } from "../types";

export function useMyProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: getMe,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { showToast } = useGlobalToast();

  return useMutation({
    mutationFn: (data: UpdateUserInput) => updateMe(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(["profile"], updated);
      showToast("Profile updated successfully.", "success");
    },
    onError: (err: Error) => {
      showToast(
        err.message || "Failed to update profile. Please try again.",
        "error"
      );
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const { showToast } = useGlobalToast();

  return useMutation({
    mutationFn: (file: File) => uploadProfileImage(file),
    onSuccess: (updated) => {
      queryClient.setQueryData(["profile"], updated);
      showToast("Profile photo updated.", "success");
    },
    onError: (err: Error) => {
      showToast(
        err.message || "Failed to upload photo. Please try again.",
        "error"
      );
    },
  });
}
