import type { Toast as ToastItem, ToastType } from "../../hooks/useToast";

const BG: Record<ToastType, string> = {
  success: "bg-emerald-600",
  error: "bg-red-600",
  info: "bg-blue-600",
};

interface Props {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const Toast = ({ toasts, onDismiss }: Props) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${BG[toast.type]} text-white px-4 py-3 rounded-2xl shadow-card-hover flex items-start gap-3`}
        >
          <span className="flex-1 text-sm leading-relaxed">{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-white/70 hover:text-white shrink-0 leading-none mt-0.5"
            aria-label="Dismiss"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;
