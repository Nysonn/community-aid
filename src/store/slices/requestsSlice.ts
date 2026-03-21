import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { EmergencyRequest } from "../../types";

interface RequestsState {
  requests: EmergencyRequest[];
  myRequests: EmergencyRequest[];
  selectedRequest: EmergencyRequest | null;
  loading: boolean;
  error: string | null;
}

const initialState: RequestsState = {
  requests: [],
  myRequests: [],
  selectedRequest: null,
  loading: false,
  error: null,
};

const requestsSlice = createSlice({
  name: "requests",
  initialState,
  reducers: {
    setRequests(state, action: PayloadAction<EmergencyRequest[]>) {
      state.requests = action.payload;
    },
    setMyRequests(state, action: PayloadAction<EmergencyRequest[]>) {
      state.myRequests = action.payload;
    },
    setSelectedRequest(state, action: PayloadAction<EmergencyRequest | null>) {
      state.selectedRequest = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    addRequest(state, action: PayloadAction<EmergencyRequest>) {
      state.requests.unshift(action.payload);
    },
    updateRequestInList(state, action: PayloadAction<EmergencyRequest>) {
      const index = state.requests.findIndex((r) => r.id === action.payload.id);
      if (index !== -1) {
        state.requests[index] = action.payload;
      }
    },
  },
});

export const {
  setRequests,
  setMyRequests,
  setSelectedRequest,
  setLoading,
  setError,
  addRequest,
  updateRequestInList,
} = requestsSlice.actions;

export default requestsSlice.reducer;
