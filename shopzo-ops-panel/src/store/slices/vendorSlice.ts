import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Vendor } from "../types/vendor";

type VendorState = {
    vendors: Vendor[];
}

const initialState: VendorState = {
    vendors: [],
};

const vendorSlice = createSlice({

    name: "vendor",
    initialState,
    reducers: {
        setVendors(state, action: PayloadAction<Vendor[]>) {
            state.vendors = action.payload;
        },
        addVendor(state, action: PayloadAction<Vendor>) {
            state.vendors.unshift(action.payload);
        },
        updateVendor(state, action: PayloadAction<Vendor>) {
            const index = state.vendors.findIndex((vendor) => vendor._id === action.payload._id);
            if (index !== -1) {
                state.vendors[index] = action.payload;
            }
        },
        deleteVendor(state, action: PayloadAction<string>) {
            state.vendors = state.vendors.filter((vendor) => vendor._id !== action.payload);
        },
        clearVendors(state) {
            state.vendors = [];
        },
    }

})

export const { setVendors, addVendor, updateVendor, deleteVendor, clearVendors } = vendorSlice.actions;
export default vendorSlice.reducer;