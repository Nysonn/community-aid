import { store } from "../store";
import {
  addPendingAction,
  removePendingAction,
  setIsSyncing,
  setLastSyncedAt,
} from "../store/slices/offlineSlice";
import { getAllPendingActions, deletePendingAction } from "./db";
import { createRequest } from "../api/requests";
import { createOffer } from "../api/offers";
import { updateMe } from "../api/users";
import type { CreateOfferInput, UpdateUserInput } from "../types";

export async function syncPendingActions(): Promise<void> {
  let actions;
  try {
    actions = await getAllPendingActions();
  } catch {
    return;
  }

  if (actions.length === 0) return;

  store.dispatch(setIsSyncing(true));

  for (const action of actions) {
    try {
      if (action.type === "CREATE_REQUEST") {
        const payload = action.payload as Record<string, string | number | undefined>;
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });
        await createRequest(formData);
      } else if (action.type === "CREATE_OFFER") {
        await createOffer(action.payload as CreateOfferInput);
      } else if (action.type === "UPDATE_PROFILE") {
        await updateMe(action.payload as UpdateUserInput);
      }

      await deletePendingAction(action.id);
      store.dispatch(removePendingAction(action.id));
    } catch {
      // Leave failed actions in queue for next sync attempt
    }
  }

  store.dispatch(setIsSyncing(false));
  store.dispatch(setLastSyncedAt(new Date().toISOString()));
}

/** Seed Redux store with any pending actions already in IDB (e.g. after page reload). */
export async function rehydratePendingActions(): Promise<void> {
  try {
    const actions = await getAllPendingActions();
    const existingIds = new Set(
      store.getState().offline.pendingActions.map((a) => a.id)
    );
    for (const action of actions) {
      if (!existingIds.has(action.id)) {
        store.dispatch(addPendingAction(action));
      }
    }
  } catch {
    // IDB unavailable — ignore
  }
}
