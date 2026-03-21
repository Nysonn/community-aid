import { createSlice } from "@reduxjs/toolkit";
import type { Offer } from "../../types";

interface OffersState {
  offers: Offer[];
  loading: boolean;
}

const initialState: OffersState = {
  offers: [],
  loading: false,
};

const offersSlice = createSlice({
  name: "offers",
  initialState,
  reducers: {},
});

export default offersSlice.reducer;
