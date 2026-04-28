"use client";

import { useEffect } from "react";

const STORAGE_KEY = "shopzo-theme";

export default function ThemeInit() {
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const prefersDark =
        stored === "dark" ||
        (stored !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", prefersDark);
    } catch {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return null;
}
