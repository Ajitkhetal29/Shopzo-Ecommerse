import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Department, Role } from "../types/genral";

type GeneralState = {
    departments: Department[];
    roles: Role[];
}

const initialState: GeneralState = {
    departments: [],
    roles: [],
};



const generalSlice = createSlice({
    name: "general",
    initialState,
    reducers: {

        setDepartments(state, action: PayloadAction<Department[]>) {
            state.departments = action.payload;
        },
        addDepartment(state, action: PayloadAction<Department>) {
            state.departments.unshift(action.payload);
        },
        deleteDepartment(state, action: PayloadAction<string>) {
            state.departments = state.departments.filter((department) => department._id !== action.payload);
        },
        clearDepartments(state) {
            state.departments = [];
        },
        setRoles(state, action: PayloadAction<Role[]>) {
            state.roles = action.payload;
        },
        addRole(state, action: PayloadAction<Role>) {
            state.roles.unshift(action.payload);
        },
        deleteRole(state, action: PayloadAction<string>) {
            state.roles = state.roles.filter((role) => role._id !== action.payload);
        },
        clearRoles(state) {
            state.roles = [];
        },
    },

});

export const { setDepartments, addDepartment, deleteDepartment, clearDepartments, setRoles, addRole, clearRoles, deleteRole } = generalSlice.actions;

export default generalSlice.reducer;