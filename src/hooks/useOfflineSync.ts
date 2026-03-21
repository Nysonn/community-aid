import { useEffect } from "react";
import { syncPendingActions, rehydratePendingActions } from "../offline/sync";

export function useOfflineSync() {
  useEffect(() => {
    rehydratePendingActions();
    syncPendingActions();

    const handleOnline = () => syncPendingActions();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);
}
