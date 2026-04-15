"use client";

import { Provider } from "react-redux";
import { store } from "@/store";
import AppInitializer from "@/components/AppInitializer";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AppInitializer>{children}</AppInitializer>
    </Provider>
  );
}
