import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Warehouse } from "../types/warehouse";



type WarehouseState = {
  warehouses: Warehouse[];
};

const initialState: WarehouseState = {
  warehouses: [],
};
const warehouseSlice = createSlice({
  name: "warehouse",
  initialState,
  reducers: {
    setWarehouses(state, action: PayloadAction<Warehouse[]>) {
      state.warehouses = action.payload;
    },
    addWarehouse(state, action: PayloadAction<Warehouse>) {
      state.warehouses.unshift(action.payload);
    },
    updateWarehouse(state, action: PayloadAction<Warehouse>) {
      const index = state.warehouses.findIndex((warehouse) => warehouse._id === action.payload._id);
      if (index !== -1) {
        state.warehouses[index] = action.payload;
      }
    },
    deleteWarehouse(state, action: PayloadAction<string>) {
      state.warehouses = state.warehouses.filter((warehouse) => warehouse._id !== action.payload);
    },
    clearWarehouses(state) {
      state.warehouses = [];
    },
  },
});

export const { setWarehouses, addWarehouse, clearWarehouses, updateWarehouse, deleteWarehouse   } =
  warehouseSlice.actions;

export default warehouseSlice.reducer;
