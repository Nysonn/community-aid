import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { createRequest, updateRequest } from "../../api/requests";
import { savePendingAction } from "../../offline/db";
import { addPendingAction } from "../../store/slices/offlineSlice";
import { useGlobalToast } from "../layout/Layout";
import { tokenStore } from "../../api/tokenStore";
import type { EmergencyRequest } from "../../types";
import type { AppDispatch } from "../../store";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editRequest?: EmergencyRequest;
}

const TYPES = ["medical", "food", "rescue", "shelter"] as const;

type LocationStatus = "idle" | "detecting" | "success" | "error";

const CreateRequestModal = ({ isOpen, onClose, onSuccess, editRequest }: Props) => {
  const isEdit = !!editRequest;
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useGlobalToast();
  const { getToken } = useClerkAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<typeof TYPES[number]>("medical");
  const [locationName, setLocationName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Geolocation state
  const [detectedLat, setDetectedLat] = useState<number | null>(null);
  const [detectedLng, setDetectedLng] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportsGeolocation = typeof navigator !== "undefined" && !!navigator.geolocation;

  // Pre-fill in edit mode
  useEffect(() => {
    if (editRequest) {
      setTitle(editRequest.title);
      setDescription(editRequest.description);
      setType(editRequest.type);
      setLocationName(editRequest.locationName);
      // Edit mode keeps existing coords but doesn't expose geo detection
      setDetectedLat(editRequest.latitude ?? null);
      setDetectedLng(editRequest.longitude ?? null);
    } else {
      setTitle("");
      setDescription("");
      setType("medical");
      setLocationName("");
      setDetectedLat(null);
      setDetectedLng(null);
      setLocationStatus("idle");
      setFiles([]);
      setPreviewUrls([]);
    }
  }, [editRequest, isOpen]);

  // Revoke object URLs on cleanup
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleDetectLocation = () => {
    setLocationStatus("detecting");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDetectedLat(position.coords.latitude);
        setDetectedLng(position.coords.longitude);
        setLocationStatus("success");
      },
      () => {
        setLocationStatus("error");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []).slice(0, 5);
    setFiles(selected);
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setPreviewUrls(
      selected
        .filter((f) => f.type.startsWith("image/"))
        .map((f) => URL.createObjectURL(f))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Refresh the token immediately before any API call so we never send
      // a stale token that Clerk has already rotated.
      const freshToken = await getToken();
      if (freshToken) {
        tokenStore.token = freshToken;
      }

      if (isEdit && editRequest) {
        await updateRequest(editRequest.id, {
          title,
          description,
          type,
          locationName,
          latitude: detectedLat ?? undefined,
          longitude: detectedLng ?? undefined,
        });
        showToast("Request updated successfully.", "success");
        onSuccess();
        onClose();
        return;
      }

      // Create mode — offline path
      if (!navigator.onLine) {
        const pendingAction = {
          id: crypto.randomUUID(),
          type: "CREATE_REQUEST",
          payload: {
            title,
            description,
            type,
            location_name: locationName,
            ...(detectedLat !== null && { latitude: detectedLat }),
            ...(detectedLng !== null && { longitude: detectedLng }),
          },
          timestamp: Date.now(),
        };
        await savePendingAction(pendingAction);
        dispatch(addPendingAction(pendingAction));
        showToast(
          "You're offline. Request saved and will sync when you reconnect.",
          "info"
        );
        onSuccess();
        onClose();
        return;
      }

      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("type", type);
      formData.append("location_name", locationName);
      if (detectedLat !== null) formData.append("latitude", String(detectedLat));
      if (detectedLng !== null) formData.append("longitude", String(detectedLng));
      files.forEach((f) => formData.append("media", f));

      await createRequest(formData);
      showToast("Request submitted. Pending admin approval.", "success");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Submission failed. Please try again.";
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Edit Request" : "Post an Emergency Request"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief title of the emergency"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Describe the situation in detail"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={type}
              onChange={(e) => setType(e.target.value as typeof TYPES[number])}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TYPES.map((t) => (
                <option key={t} value={t} className="capitalize">
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Kampala, Nakawa Division"
            />
          </div>

          {/* Geolocation */}
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location Coordinates{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>

              {supportsGeolocation ? (
                <>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={locationStatus === "detecting"}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border transition-colors disabled:cursor-not-allowed
                      ${locationStatus === "success"
                        ? "border-green-500 text-green-700 bg-green-50 hover:bg-green-100"
                        : locationStatus === "detecting"
                        ? "border-gray-300 text-gray-400 bg-gray-50"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    <svg
                      className="h-4 w-4 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {locationStatus === "detecting"
                      ? "Detecting location..."
                      : locationStatus === "success"
                      ? "Location Detected"
                      : "Detect My Location"}
                  </button>

                  {locationStatus === "success" && detectedLat !== null && detectedLng !== null && (
                    <p className="mt-1.5 text-xs text-green-700">
                      Location detected: {detectedLat.toFixed(4)}, {detectedLng.toFixed(4)}
                    </p>
                  )}

                  {locationStatus === "error" && (
                    <p className="mt-1.5 text-xs text-red-600">
                      Could not detect location. You can still submit without it.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-xs text-gray-400">
                  Location detection is not supported in this browser.
                </p>
              )}
            </div>
          )}

          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Media (up to 5 images or PDFs)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={handleFileChange}
                className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {previewUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {previewUrls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Preview ${i + 1}`}
                      className="h-16 w-16 object-cover rounded border border-gray-200"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Submitting..." : isEdit ? "Save Changes" : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRequestModal;
