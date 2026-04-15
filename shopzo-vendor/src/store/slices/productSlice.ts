import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Product } from "../types/product";

type ProductState = {
  products: Product[];
};

const initialState: ProductState = {
  products: [],
};

const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    setProducts(state, action: PayloadAction<Product[]>) {
      state.products = action.payload;
    },
    addProduct(state, action: PayloadAction<Product>) {
      state.products.unshift(action.payload);
    },
    updateProduct(state, action: PayloadAction<Product>) {
      const index = state.products.findIndex((p) => p._id === action.payload._id);
      if (index !== -1) state.products[index] = action.payload;
    },
    clearProducts(state) {
      state.products = [];
    },
  },
});

export const { setProducts, addProduct, updateProduct, clearProducts } = productSlice.actions;
export default productSlice.reducer;
