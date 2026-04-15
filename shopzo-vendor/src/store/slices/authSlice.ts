import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type Vendor = {
  _id: string;
  name: string;
  email: string;
  contactNumber?: string;
  address?: { formatted?: string; city?: string; state?: string };
  isActive?: boolean;
};

type AuthState = {
  vendor: Vendor | null;
  isAuthenticated: boolean;
};

const initialState: AuthState = {
  vendor: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setVendor(state, action: PayloadAction<Vendor>) {
      state.vendor = action.payload;
      state.isAuthenticated = true;
    },
    logout(state) {
      state.vendor = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setVendor, logout } = authSlice.actions;
export default authSlice.reducer;
