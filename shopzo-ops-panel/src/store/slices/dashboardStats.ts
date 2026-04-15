import { createSlice, PayloadAction } from "@reduxjs/toolkit";


type DashboardStatsState = {
    totalUsers: number;
    totalWarehouses: number;
    totalVendors: number;
    totalProducts: number;
    totalDepartments: number;
    totalRoles: number;
};

const initialState: DashboardStatsState = {
    totalUsers: 0,
    totalWarehouses: 0,
    totalVendors: 0,
    totalProducts: 0,
    totalDepartments: 0,
    totalRoles: 0,
};

const dashboardStatsSlice = createSlice({

name: "dashboardStats",
initialState,
reducers: {
    setDashboardStats(state, action: PayloadAction<DashboardStatsState>) {
        state.totalUsers = action.payload.totalUsers;
        state.totalWarehouses = action.payload.totalWarehouses;
        state.totalVendors = action.payload.totalVendors;
        state.totalProducts = action.payload.totalProducts;
        state.totalDepartments = action.payload.totalDepartments;
        state.totalRoles = action.payload.totalRoles;
    }
}
});

export const { setDashboardStats } = dashboardStatsSlice.actions;
export default dashboardStatsSlice.reducer;





