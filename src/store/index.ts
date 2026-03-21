import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import requestsReducer from "./slices/requestsSlice";
import offersReducer from "./slices/offersSlice";
import offlineReducer from "./slices/offlineSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    requests: requestsReducer,
    offers: offersReducer,
    offline: offlineReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
