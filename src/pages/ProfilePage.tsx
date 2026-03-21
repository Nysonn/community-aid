import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { getMe, updateMe, uploadProfileImage } from "../api/users";
import { getMyRequests } from "../api/requests";
import {
  saveProfileToCache,
  getCachedProfile,
  savePendingAction,
} from "../offline/db";
import { addPendingAction } from "../store/slices/offlineSlice";
import { useGlobalToast } from "../components/layout/Layout";
import { TYPE_BADGE, STATUS_BADGE } from "../components/requests/RequestCard";
import type { AppDispatch } from "../store";
import type { User, UpdateUserInput } from "../types";

const Spinner = () => (
  <div className="flex justify-center items-center py-20">
    <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const AvatarPlaceholder = ({ name }: { name: string }) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="h-20 w-20 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold select-none">
      {initials}
    </div>
  );
};

const ProfilePage = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useGlobalToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cachedProfile, setCachedProfile] = useState<User | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UpdateUserInput>({
    fullName: "",
    phoneNumber: "",
    bio: "",
  });

  const [avatarUploading, setAvatarUploading] = useState(false);

  // Online/offline tracking
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Fetch profile
  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery<User>({
    queryKey: ["profile"],
    queryFn: async () => {
      const data = await getMe();
      await saveProfileToCache(data);
      return data;
    },
    enabled: isOnline,
    retry: false,
  });

  // Load cached profile when offline or on error
  useEffect(() => {
    if (!isOnline || isError) {
      getCachedProfile().then((p) => setCachedProfile(p ?? null));
    }
  }, [isOnline, isError]);

  const displayProfile = profile ?? cachedProfile;
  const showCacheBanner = (!isOnline || isError) && cachedProfile !== null;

  // Sync edit form with displayed profile
  useEffect(() => {
    if (displayProfile) {
      setEditForm({
        fullName: displayProfile.fullName,
        phoneNumber: displayProfile.phoneNumber,
        bio: displayProfile.bio ?? "",
      });
    }
  }, [displayProfile]);

  // My requests
  const { data: myRequests = [] } = useQuery({
    queryKey: ["my-requests"],
    queryFn: getMyRequests,
    enabled: isOnline,
    retry: false,
  });

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserInput) => updateMe(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(["profile"], updated);
      saveProfileToCache(updated);
      setIsEditing(false);
      showToast("Profile updated successfully.", "success");
    },
    onError: async () => {
      if (!navigator.onLine) {
        const pendingAction = {
          id: crypto.randomUUID(),
          type: "UPDATE_PROFILE",
          payload: editForm,
          timestamp: Date.now(),
        };
        await savePendingAction(pendingAction);
        dispatch(addPendingAction(pendingAction));
        setIsEditing(false);
        showToast("You're offline. Changes will sync when you reconnect.", "info");
      } else {
        showToast("Failed to save changes. Please try again.", "error");
      }
    },
  });

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(editForm);
  };

  // Avatar upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const result = await uploadProfileImage(file);
      queryClient.setQueryData(["profile"], (old: User | undefined) =>
        old ? { ...old, profileImageUrl: result.profileImageUrl } : old
      );
      showToast("Profile photo updated.", "success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to upload image.";
      showToast(message, "error");
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (isLoading) return <Spinner />;

  if (!displayProfile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-500">
        Could not load your profile. Please check your connection and try again.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Cached data banner */}
      {showCacheBanner && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-2.5 rounded-md">
          Showing cached profile data. Connect to the internet to see the latest
          information.
        </div>
      )}

      {/* ── Section 1: Profile Info ── */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-5 mb-6">
          {displayProfile.profileImageUrl ? (
            <img
              src={displayProfile.profileImageUrl}
              alt={displayProfile.fullName}
              className="h-20 w-20 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <AvatarPlaceholder name={displayProfile.fullName} />
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {displayProfile.fullName}
            </h1>
            <p className="text-sm text-gray-500">{displayProfile.email}</p>
            <span className="inline-block mt-1 text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">
              {displayProfile.role.replace("_", " ")}
            </span>
          </div>
        </div>

        {!isEditing ? (
          <>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">
                  Phone Number
                </dt>
                <dd className="text-gray-800">{displayProfile.phoneNumber}</dd>
              </div>
              {displayProfile.bio && (
                <div>
                  <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">
                    Bio
                  </dt>
                  <dd className="text-gray-700 leading-relaxed">
                    {displayProfile.bio}
                  </dd>
                </div>
              )}
            </dl>

            <button
              onClick={() => setIsEditing(true)}
              className="mt-5 px-4 py-2 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Edit Profile
            </button>
          </>
        ) : (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={editForm.fullName ?? ""}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, fullName: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={editForm.phoneNumber ?? ""}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, phoneNumber: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={editForm.bio ?? ""}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, bio: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="A short description about yourself"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      {/* ── Section 2: Profile Photo Upload ── */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          Update Profile Photo
        </h2>
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            disabled={avatarUploading}
            className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
          />
          {avatarUploading && (
            <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </section>

      {/* ── Section 3: My Requests ── */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          My Requests
        </h2>

        {myRequests.length === 0 ? (
          <p className="text-sm text-gray-400">
            You have not posted any requests yet.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {myRequests.map((request) => (
              <li
                key={request.id}
                className="py-3 flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {request.title}
                  </p>
                  <div className="flex gap-2 mt-1">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${TYPE_BADGE[request.type]}`}
                    >
                      {request.type}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[request.status]}`}
                    >
                      {request.status}
                    </span>
                  </div>
                </div>
                <Link
                  to={`/requests/${request.id}`}
                  className="text-sm font-medium text-blue-600 hover:underline shrink-0"
                >
                  View
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default ProfilePage;
