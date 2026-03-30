import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useMyProfile, useUpdateProfile, useUploadAvatar } from "../hooks/useUsers";
import { useMyRequests } from "../hooks/useRequests";
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
  <div className="flex justify-center items-center py-24">
    <div className="h-9 w-9 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const ProfileSkeleton = () => (
  <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 animate-pulse">
    {/* Section 1: Profile info */}
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-card">
      <div className="flex items-center gap-5 mb-6 pb-6 border-b border-gray-50">
        <div className="h-20 w-20 rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gray-200 rounded-full w-2/5" />
          <div className="h-3.5 bg-gray-100 rounded-full w-3/5" />
          <div className="h-5 w-20 bg-gray-100 rounded-full mt-1" />
        </div>
      </div>
      <div className="space-y-5">
        <div>
          <div className="h-3 bg-gray-100 rounded-full w-24 mb-2" />
          <div className="h-4 bg-gray-200 rounded-full w-1/3" />
        </div>
        <div>
          <div className="h-3 bg-gray-100 rounded-full w-16 mb-2" />
          <div className="h-4 bg-gray-200 rounded-full w-3/4" />
          <div className="h-4 bg-gray-100 rounded-full w-1/2 mt-1.5" />
        </div>
      </div>
      <div className="mt-6 h-9 w-28 bg-gray-200 rounded-full" />
    </div>
    {/* Section 2: Photo upload */}
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-card">
      <div className="h-4 bg-gray-200 rounded-full w-28 mb-2" />
      <div className="h-3 bg-gray-100 rounded-full w-48 mb-4" />
      <div className="h-9 bg-gray-100 rounded-xl w-64" />
    </div>
    {/* Section 3: My Requests */}
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-card">
      <div className="h-4 bg-gray-200 rounded-full w-28 mb-5" />
      <div className="divide-y divide-gray-50">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="py-3.5 flex items-center justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-gray-200 rounded-full w-3/5" />
              <div className="flex gap-1.5">
                <div className="h-4 w-14 bg-gray-100 rounded-full" />
                <div className="h-4 w-14 bg-gray-100 rounded-full" />
              </div>
            </div>
            <div className="h-6 w-12 bg-gray-100 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
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
    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center text-2xl font-bold select-none shadow-md">
      {initials}
    </div>
  );
};

const ProfilePage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useGlobalToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cachedProfile, setCachedProfile] = useState<User | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UpdateUserInput>({
    full_name: "",
    phone_number: "",
    bio: "",
  });

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
  } = useMyProfile();

  // Load cached profile when offline or on error
  useEffect(() => {
    if (!isOnline || isError) {
      getCachedProfile().then((p) => setCachedProfile(p ?? null));
    }
  }, [isOnline, isError]);

  // Save to cache whenever fresh data arrives
  useEffect(() => {
    if (profile) saveProfileToCache(profile);
  }, [profile]);

  const displayProfile = profile ?? cachedProfile;
  const showCacheBanner = (!isOnline || isError) && cachedProfile !== null;

  // Sync edit form with displayed profile
  useEffect(() => {
    if (displayProfile) {
      setEditForm({
        full_name: displayProfile.full_name,
        phone_number: displayProfile.phone_number,
        bio: displayProfile.bio ?? "",
      });
    }
  }, [displayProfile]);

  // My requests
  const { data: myRequests = [] } = useMyRequests();

  // Hooks
  const updateProfileMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      return;
    }
    updateProfileMutation.mutate(editForm, {
      onSuccess: () => setIsEditing(false),
    });
  };

  // Avatar upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadAvatarMutation.mutate(file, {
      onSettled: () => {
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
    });
  };

  if (isLoading) return <ProfileSkeleton />;

  if (!displayProfile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-500">
        Could not load your profile. Please check your connection and try again.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Cached data banner */}
      {showCacheBanner && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-2xl flex items-center gap-2">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Showing cached profile data. Connect to the internet to see the latest information.
        </div>
      )}

      {/* ── Section 1: Profile Info ── */}
      <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-card">
        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-gray-50">
          {displayProfile.profile_image_url ? (
            <img
              src={displayProfile.profile_image_url}
              alt={displayProfile.full_name}
              className="h-20 w-20 rounded-full object-cover border-2 border-gray-100 shadow-sm"
            />
          ) : (
            <AvatarPlaceholder name={displayProfile.full_name} />
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {displayProfile.full_name}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">{displayProfile.email}</p>
            <span className="inline-block mt-2 text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full capitalize">
              {displayProfile.role.replace("_", " ")}
            </span>
          </div>
        </div>

        {!isEditing ? (
          <>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
                  Phone Number
                </dt>
                <dd className="text-slate-800 font-medium">{displayProfile.phone_number}</dd>
              </div>
              {displayProfile.bio && (
                <div>
                  <dt className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
                    Bio
                  </dt>
                  <dd className="text-slate-600 leading-relaxed">
                    {displayProfile.bio}
                  </dd>
                </div>
              )}
            </dl>

            <button
              onClick={() => setIsEditing(true)}
              className="mt-6 px-5 py-2 text-sm font-semibold border-2 border-gray-200 rounded-full hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
            >
              Edit Profile
            </button>
          </>
        ) : (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={editForm.full_name ?? ""}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, full_name: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={editForm.phone_number ?? ""}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, phone_number: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Bio{" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={editForm.bio ?? ""}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, bio: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm resize-none"
                placeholder="A short description about yourself"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-full hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-5 py-2 text-sm font-semibold border-2 border-gray-200 rounded-full hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      {/* ── Section 2: Profile Photo Upload ── */}
      <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-card">
        <h2 className="text-base font-bold text-slate-900 mb-1">
          Profile Photo
        </h2>
        <p className="text-xs text-slate-400 mb-4">Upload a new profile picture</p>
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            disabled={uploadAvatarMutation.isPending}
            className="text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 transition-all"
          />
          {uploadAvatarMutation.isPending && (
            <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </section>

      {/* ── Section 3: My Requests ── */}
      <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-card">
        <h2 className="text-base font-bold text-slate-900 mb-5">
          My Requests
        </h2>

        {myRequests.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">
            You have not posted any requests yet.
          </p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {myRequests.map((request) => (
              <li
                key={request.id}
                className="py-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {request.title}
                  </p>
                  <div className="flex gap-1.5 mt-1.5">
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${TYPE_BADGE[request.type]}`}
                    >
                      {request.type}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${STATUS_BADGE[request.status]}`}
                    >
                      {request.status}
                    </span>
                  </div>
                </div>
                <Link
                  to={`/requests/${request.id}`}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors shrink-0"
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
