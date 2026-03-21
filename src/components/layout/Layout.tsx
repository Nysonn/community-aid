import React, { createContext, useContext } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import OfflineBanner from "../common/OfflineBanner";
import Toast from "../common/Toast";
import { useOfflineSync } from "../../hooks/useOfflineSync";
import { useToast } from "../../hooks/useToast";

type ToastAPI = ReturnType<typeof useToast>;

export const ToastContext = createContext<ToastAPI | null>(null);

export function useGlobalToast(): ToastAPI {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useGlobalToast must be used within Layout");
  return ctx;
}

const Layout = () => {
  useOfflineSync();
  const toast = useToast();

  return (
    <ToastContext.Provider value={toast}>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <OfflineBanner />
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <footer className="bg-white border-t border-gray-200 py-4 text-center text-sm text-gray-500">
          CommunityAid - Empowering Communities
        </footer>
        <Toast toasts={toast.toasts} onDismiss={toast.dismissToast} />
      </div>
    </ToastContext.Provider>
  );
};

export default Layout;
