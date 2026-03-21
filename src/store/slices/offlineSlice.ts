import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface PendingActionEntry {
  id: string;
  type: string;
  payload: unknown;
  timestamp: number;
}

interface OfflineState {
  pendingActions: PendingActionEntry[];
  isSyncing: boolean;
  lastSyncedAt: string | null;
}

const initialState: OfflineState = {
  pendingActions: [],
  isSyncing: false,
  lastSyncedAt: null,
};

const offlineSlice = createSlice({
  name: "offline",
  initialState,
  reducers: {
    addPendingAction(state, action: PayloadAction<PendingActionEntry>) {
      state.pendingActions.push(action.payload);
    },
    removePendingAction(state, action: PayloadAction<string>) {
      state.pendingActions = state.pendingActions.filter(
        (a) => a.id !== action.payload
      );
    },
    setIsSyncing(state, action: PayloadAction<boolean>) {
      state.isSyncing = action.payload;
    },
    setLastSyncedAt(state, action: PayloadAction<string | null>) {
      state.lastSyncedAt = action.payload;
    },
    clearPendingActions(state) {
      state.pendingActions = [];
    },
  },
});

export const {
  addPendingAction,
  removePendingAction,
  setIsSyncing,
  setLastSyncedAt,
  clearPendingActions,
} = offlineSlice.actions;

export default offlineSlice.reducer;
