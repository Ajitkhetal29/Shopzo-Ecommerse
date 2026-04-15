"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { initializeApp } from "@/services/appInit";

export default function AppInitializer({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Skip initialization on login page
    if (pathname === "/login") {
      setIsInitialized(true);
      return;
    }

    const init = async () => {
      await initializeApp();
      setIsInitialized(true);
    };


    init();
  }, [pathname]);

  // Show loading only on first mount (not on login page)
  if (!isInitialized && pathname !== "/login") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 transition-colors">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white mb-4"></div>
          <p className="text-base font-medium text-gray-900 dark:text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
