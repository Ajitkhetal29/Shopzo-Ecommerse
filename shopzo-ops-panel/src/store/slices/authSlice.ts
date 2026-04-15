import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type Department = {
  _id: string;
  name: string;
  code?: string;
};

type Role = {
  _id: string;
  name: string;
  code?: string;
};

type User = {
  _id: string;
  id?: string; // For backward compatibility
  name: string;
  email: string;
  department: Department ; // Can be object or string for backward compatibility
  role: Role ; // Can be object or string for backward compatibility
  isActive: boolean;
  createdAt: Date;
};

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
};

const initialState: AuthState = {  
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      // Normalize user object - ensure _id is set and id exists for backward compatibility
      const user = action.payload;
      if (user._id && !user.id) {
        user.id = user._id;
      }
      state.user = user;
      state.isAuthenticated = true;
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;