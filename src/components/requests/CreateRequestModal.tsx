import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { useCreateRequest, useUpdateRequest } from "../../hooks/useRequests";
import { savePendingAction } from "../../offline/db";
import { addPendingAction } from "../../store/slices/offlineSlice";
import { useGlobalToast } from "../layout/Layout";
import { tokenStore } from "../../api/tokenStore";
import type { CreateRequestInput, EmergencyRequest } from "../../types";
import type { AppDispatch } from "../../store";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editRequest?: EmergencyRequest;
}

const PRESET_TYPES = ["medical", "food", "rescue", "shelter"] as const;

type LocationStatus = "idle" | "detecting" | "success" | "error";

const ACCEPTED_MEDIA_TYPES = ["image/", "application/pdf"];
const ACCEPTABLE_GEOLOCATION_ACCURACY_METERS = 500;
const GEOLOCATION_DETECTION_WINDOW_MS = 12000;

type DonationPayload = Pick<
  CreateRequestInput,
  | "target_amount"
  | "payment_type"
  | "bank_account_name"
  | "bank_account_number"
  | "bank_name"
  | "receiving_mobile_provider"
  | "receiving_mobile_number"
>;

const CreateRequestModal = ({ isOpen, onClose, onSuccess, editRequest }: Props) => {
  const isEdit = !!editRequest;
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useGlobalToast();
  const { getToken } = useClerkAuth();

  const createRequestMutation = useCreateRequest();
  const updateRequestMutation = useUpdateRequest();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>("medical");
  const [customType, setCustomType] = useState("");
  const [locationName, setLocationName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Fundraising
  const [targetAmount, setTargetAmount] = useState("");
  // Payment receiving details
  const [paymentType, setPaymentType] = useState<"bank" | "mobile_money" | "">("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [receivingMobileProvider, setReceivingMobileProvider] = useState<"mtn_momo" | "airtel_money">("mtn_momo");
  const [receivingMobileNumber, setReceivingMobileNumber] = useState("");

  // Geolocation state
  const [detectedLat, setDetectedLat] = useState<number | null>(null);
  const [detectedLng, setDetectedLng] = useState<number | null>(null);
  const [detectedAccuracy, setDetectedAccuracy] = useState<number | null>(null);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const geoWatchIdRef = useRef<number | null>(null);
  const geoTimeoutIdRef = useRef<number | null>(null);

  const supportsGeolocation = typeof navigator !== "undefined" && !!navigator.geolocation;

  const stopLocationDetection = () => {
    if (geoWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(geoWatchIdRef.current);
      geoWatchIdRef.current = null;
    }

    if (geoTimeoutIdRef.current !== null) {
      window.clearTimeout(geoTimeoutIdRef.current);
      geoTimeoutIdRef.current = null;
    }
  };

  // Pre-fill in edit mode
  useEffect(() => {
    if (editRequest) {
      setTitle(editRequest.title);
      setDescription(editRequest.description);
      const isPreset = (PRESET_TYPES as readonly string[]).includes(editRequest.type);
      setType(isPreset ? editRequest.type : "other");
      setCustomType(isPreset ? "" : editRequest.type);
      setLocationName(editRequest.location_name);
      setDetectedLat(editRequest.latitude ?? null);
      setDetectedLng(editRequest.longitude ?? null);
      setDetectedAccuracy(null);
      setManualLat(
        editRequest.latitude !== undefined && editRequest.latitude !== null
          ? String(editRequest.latitude)
          : ""
      );
      setManualLng(
        editRequest.longitude !== undefined && editRequest.longitude !== null
          ? String(editRequest.longitude)
          : ""
      );
      // Prefill payment receiving fields in edit mode
      setTargetAmount(editRequest.target_amount != null ? String(editRequest.target_amount) : "");
      setPaymentType(editRequest.payment_type ?? "");
      setBankAccountName(editRequest.bank_account_name ?? "");
      setBankAccountNumber(editRequest.bank_account_number ?? "");
      setBankName(editRequest.bank_name ?? "");
      setReceivingMobileProvider((editRequest.receiving_mobile_provider as "mtn_momo" | "airtel_money") ?? "mtn_momo");
      setReceivingMobileNumber(editRequest.receiving_mobile_number ?? "");
    } else {
      setTitle("");
      setDescription("");
      setType("medical");
      setLocationName("");
      setDetectedLat(null);
      setDetectedLng(null);
      setDetectedAccuracy(null);
      setManualLat("");
      setManualLng("");
      setLocationStatus("idle");
      setFiles([]);
      setPreviewUrls([]);
      setTargetAmount("");
      setPaymentType("");
      setBankAccountName("");
      setBankAccountNumber("");
      setBankName("");
      setReceivingMobileProvider("mtn_momo");
      setReceivingMobileNumber("");
    }
  }, [editRequest, isOpen]);

  // Revoke object URLs on cleanup
  useEffect(() => {
    return () => {
      stopLocationDetection();
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleDetectLocation = () => {
    if (!supportsGeolocation) {
      setLocationStatus("error");
      return;
    }

    stopLocationDetection();
    setLocationStatus("detecting");
    setDetectedAccuracy(null);

    let bestPosition: GeolocationPosition | null = null;

    const finalizeDetection = () => {
      stopLocationDetection();

      if (!bestPosition) {
        setLocationStatus("error");
        showToast(
          "Could not get your device location. Enable device location services or enter coordinates manually.",
          "error"
        );
        return;
      }

      const { latitude, longitude, accuracy } = bestPosition.coords;
      setDetectedLat(latitude);
      setDetectedLng(longitude);
      setDetectedAccuracy(accuracy);

      if (accuracy > ACCEPTABLE_GEOLOCATION_ACCURACY_METERS) {
        setLocationStatus("error");
        showToast(
          "Your browser returned a coarse network location instead of your device location. Turn on GPS/location services or enter coordinates manually.",
          "error"
        );
        return;
      }

      setManualLat(latitude.toFixed(6));
      setManualLng(longitude.toFixed(6));
      setLocationStatus("success");
    };

    geoWatchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        if (
          !bestPosition ||
          position.coords.accuracy < bestPosition.coords.accuracy
        ) {
          bestPosition = position;
        }

        if (
          position.coords.accuracy <= ACCEPTABLE_GEOLOCATION_ACCURACY_METERS
        ) {
          finalizeDetection();
        }
      },
      () => {
        finalizeDetection();
      },
      {
        enableHighAccuracy: true,
        timeout: GEOLOCATION_DETECTION_WINDOW_MS,
        maximumAge: 0,
      }
    );

    geoTimeoutIdRef.current = window.setTimeout(
      finalizeDetection,
      GEOLOCATION_DETECTION_WINDOW_MS
    );
  };

  const resolveCoordinates = () => {
    const trimmedManualLat = manualLat.trim();
    const trimmedManualLng = manualLng.trim();

    if ((trimmedManualLat && !trimmedManualLng) || (!trimmedManualLat && trimmedManualLng)) {
      return { error: "Enter both latitude and longitude, or leave both blank." };
    }

    if (trimmedManualLat && trimmedManualLng) {
      const latitude = Number(trimmedManualLat);
      const longitude = Number(trimmedManualLng);

      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        return { error: "Latitude and longitude must be valid numbers." };
      }

      if (latitude < -90 || latitude > 90) {
        return { error: "Latitude must be between -90 and 90." };
      }

      if (longitude < -180 || longitude > 180) {
        return { error: "Longitude must be between -180 and 180." };
      }

      return { latitude, longitude };
    }

    return {
      latitude: detectedLat ?? undefined,
      longitude: detectedLng ?? undefined,
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    const supportedFiles = selectedFiles.filter((file) =>
      ACCEPTED_MEDIA_TYPES.some((type) => file.type.startsWith(type))
    );
    const limitedFiles = supportedFiles.slice(0, 5);

    if (selectedFiles.length > 5) {
      showToast("You can upload up to 5 files per request.", "info");
    }

    if (supportedFiles.length !== selectedFiles.length) {
      showToast("Only images and PDF files can be attached to a request.", "error");
    }

    setFiles(limitedFiles);
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setPreviewUrls(
      limitedFiles
        .filter((f) => f.type.startsWith("image/"))
        .map((f) => URL.createObjectURL(f))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedLocationName = locationName.trim();
    const resolvedType = type === "other" ? customType.trim() : type;

    if (!trimmedTitle || !trimmedDescription || !trimmedLocationName) {
      showToast("Title, description, and location are required.", "error");
      return;
    }
    if (!resolvedType) {
      showToast("Please specify the emergency type.", "error");
      return;
    }

    const coordinates = resolveCoordinates();
    if (coordinates.error) {
      showToast(coordinates.error, "error");
      return;
    }

    const trimmedTargetAmount = targetAmount.trim();
    const hasDonationConfiguration = Boolean(trimmedTargetAmount || paymentType);
    let donationPayload: DonationPayload = {};

    if (hasDonationConfiguration) {
      const parsedTargetAmount = Number(trimmedTargetAmount);

      if (!trimmedTargetAmount || Number.isNaN(parsedTargetAmount) || parsedTargetAmount <= 0) {
        showToast("Enter a target amount greater than 0 to receive donations.", "error");
        return;
      }

      if (!paymentType) {
        showToast("Select how you want to receive donations.", "error");
        return;
      }

      donationPayload = {
        target_amount: parsedTargetAmount,
        payment_type: paymentType,
      };

      if (paymentType === "bank") {
        if (!bankAccountName.trim() || !bankAccountNumber.trim() || !bankName.trim()) {
          showToast("Please fill in all bank account details.", "error");
          return;
        }

        donationPayload = {
          ...donationPayload,
          bank_account_name: bankAccountName.trim(),
          bank_account_number: bankAccountNumber.trim(),
          bank_name: bankName.trim(),
        };
      }

      if (paymentType === "mobile_money") {
        if (!receivingMobileNumber.trim()) {
          showToast("Please enter a mobile money number.", "error");
          return;
        }

        donationPayload = {
          ...donationPayload,
          receiving_mobile_provider: receivingMobileProvider,
          receiving_mobile_number: receivingMobileNumber.trim(),
        };
      }
    }

    // Refresh the token before any API call so we never send a stale token.
    const freshToken = await getToken();
    if (freshToken) {
      tokenStore.token = freshToken;
    } else if (navigator.onLine) {
      showToast("Your session is missing. Sign in again and retry.", "error");
      return;
    }

    if (isEdit && editRequest) {
      updateRequestMutation.mutate(
        {
          id: editRequest.id,
          data: {
            title: trimmedTitle,
            description: trimmedDescription,
            type: resolvedType,
            location_name: trimmedLocationName,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            ...donationPayload,
          },
        },
        { onSuccess: () => { onSuccess(); onClose(); } }
      );
      return;
    }

    // Create mode — offline path
    if (!navigator.onLine) {
      const pendingAction = {
        id: crypto.randomUUID(),
        type: "CREATE_REQUEST",
        payload: {
          title: trimmedTitle,
          description: trimmedDescription,
          type,
          location_name: trimmedLocationName,
          ...(coordinates.latitude !== undefined && { latitude: coordinates.latitude }),
          ...(coordinates.longitude !== undefined && { longitude: coordinates.longitude }),
          ...donationPayload,
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

    createRequestMutation.mutate({
      title: trimmedTitle,
      description: trimmedDescription,
      type,
      location_name: trimmedLocationName,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      media: files,
      ...donationPayload,
    }, {
      onSuccess: () => { onSuccess(); onClose(); },
      onError: async (err) => {
        const status = (err as Error & { status?: number }).status;
        if (!status) {
          // True network failure — treat as offline and queue
          const pendingAction = {
            id: crypto.randomUUID(),
            type: "CREATE_REQUEST",
            payload: {
              title: trimmedTitle,
              description: trimmedDescription,
              type,
              location_name: trimmedLocationName,
              ...(coordinates.latitude !== undefined && { latitude: coordinates.latitude }),
              ...(coordinates.longitude !== undefined && { longitude: coordinates.longitude }),
              ...donationPayload,
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
        }
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-[0_8px_40px_-8px_rgba(37,99,235,0.18),0_2px_16px_-4px_rgba(0,0,0,0.10)] w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Gradient accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isEdit ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 4v16m8-8H4"} />
              </svg>
            </div>
            <h2 className="text-base font-bold text-slate-900">
              {isEdit ? "Edit Request" : "Post an Emergency Request"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm"
              placeholder="Brief title of the emergency"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm resize-none"
              placeholder="Describe the situation in detail"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm"
            >
              {PRESET_TYPES.map((t) => (
                <option key={t} value={t} className="capitalize">
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
              <option value="other">Other / Custom type…</option>
            </select>
            {type === "other" && (
              <input
                type="text"
                required
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="Describe the emergency type (e.g. Flooding, Fire)"
                className="mt-2 w-full border border-blue-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm bg-blue-50 placeholder:text-slate-400"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Location Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm"
              placeholder="e.g. Kampala, Nakawa Division"
            />
          </div>

          {/* Geolocation */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Location Coordinates{" "}
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>

            {supportsGeolocation ? (
              <>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={locationStatus === "detecting"}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all duration-200 disabled:cursor-not-allowed
                    ${locationStatus === "success"
                      ? "border-green-500 text-green-700 bg-green-50 hover:bg-green-100"
                      : locationStatus === "detecting"
                      ? "border-gray-200 text-slate-400 bg-gray-50"
                      : locationStatus === "error"
                      ? "border-red-300 text-red-700 bg-red-50 hover:bg-red-100"
                      : "border-gray-200 text-slate-700 hover:border-gray-300 hover:bg-gray-50"
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
                    ? "Detecting device location..."
                    : locationStatus === "success"
                    ? "Device Location Captured"
                    : "Use My Device Location"}
                </button>

                <p className="mt-2 text-xs text-slate-400">
                  The app now waits for the best GPS/location reading it can get. If your browser only returns a coarse provider/network location, enter the exact coordinates manually below.
                </p>

                {detectedLat !== null && detectedLng !== null && (
                  <p className={`mt-1.5 text-xs ${locationStatus === "success" ? "text-green-700" : "text-amber-700"}`}>
                    Detected coordinates: {detectedLat.toFixed(6)}, {detectedLng.toFixed(6)}
                    {detectedAccuracy !== null
                      ? ` (accuracy about ${Math.round(detectedAccuracy)} m)`
                      : ""}
                  </p>
                )}

                {locationStatus === "error" && (
                  <p className="mt-1.5 text-xs text-red-600">
                    Your browser did not return a precise device location. Turn on device GPS/location services or enter latitude and longitude manually.
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-slate-400">
                Location detection is not supported in this browser. Enter coordinates manually if you have them.
              </p>
            )}

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm"
                  placeholder="e.g. 0.347596"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm"
                  placeholder="e.g. 32.582520"
                />
              </div>
            </div>
          </div>

          {!isEdit && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Media (up to 5 images or PDFs)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={handleFileChange}
                className="w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
              />
              {previewUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {previewUrls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Preview ${i + 1}`}
                      className="h-16 w-16 object-cover rounded-xl border border-gray-100"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Fundraising ──────────────────────────────────────── */}
          <div className="pt-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-gray-100" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fundraising (optional)</span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Target Amount (UGX)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm"
                placeholder="e.g. 500000"
              />
            </div>
          </div>

          {/* ── Payment Receiving Details ─────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-gray-100" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Where to receive donations</span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Add your payment details so donors know where to send money. This will be shown publicly on your request card.
            </p>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { value: "", label: "Not specified" },
                { value: "bank", label: "Bank (VISA)" },
                { value: "mobile_money", label: "Mobile Money" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPaymentType(opt.value as "bank" | "mobile_money" | "")}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border-2 transition-all duration-150
                    ${paymentType === opt.value
                      ? "border-blue-500 text-blue-700 bg-blue-50"
                      : "border-gray-200 text-slate-500 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {paymentType === "bank" && (
              <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Account Holder Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    placeholder="Full name on account"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Account Number <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    placeholder="e.g. 1234567890"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Bank Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    placeholder="e.g. Stanbic Bank"
                  />
                </div>
              </div>
            )}

            {paymentType === "mobile_money" && (
              <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Provider <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["mtn_momo", "airtel_money"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setReceivingMobileProvider(p)}
                        className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all
                          ${receivingMobileProvider === p
                            ? "border-yellow-400 text-yellow-700 bg-yellow-50"
                            : "border-gray-200 text-slate-500 hover:border-gray-300"
                          }`}
                      >
                        {p === "mtn_momo" ? "MTN MoMo" : "Airtel Money"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mobile Number <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    value={receivingMobileNumber}
                    onChange={(e) => setReceivingMobileNumber(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    placeholder="e.g. 0771234567"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 border-2 border-gray-200 rounded-full hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createRequestMutation.isPending || updateRequestMutation.isPending}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-blue-200/60 hover:shadow-blue-300/40 active:scale-95"
            >
              {(createRequestMutation.isPending || updateRequestMutation.isPending)
                ? "Submitting..."
                : isEdit
                ? "Save Changes"
                : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRequestModal;
