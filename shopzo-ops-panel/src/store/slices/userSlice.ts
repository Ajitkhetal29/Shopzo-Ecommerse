

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../types/users";

type UserState = {
    users: User[];
}

const initialState: UserState = {
    users: [],
};

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUsers(state, action: PayloadAction<User[]>) {
            state.users = action.payload;
        },
        addUser(state, action: PayloadAction<User>) {
            state.users.unshift(action.payload);
        },
        updateUser(state, action: PayloadAction<User>) {
            const index = state.users.findIndex((user) => user._id === action.payload._id); 
            if (index !== -1) {
                state.users[index] = action.payload;
            }
        },
        deleteUser(state, action: PayloadAction<string>) {
            state.users = state.users.filter((user) => user._id !== action.payload);
        }
    },
});

export const { setUsers, addUser, updateUser, deleteUser } = userSlice.actions;
export default userSlice.reducer;