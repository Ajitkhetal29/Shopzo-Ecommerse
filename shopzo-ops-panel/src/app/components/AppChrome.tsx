"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { API_ENDPOINTS } from "@/lib/api";
import type { AppDispatch, RootState } from "@/store";
import { logout, setUser } from "@/store/slices/authSlice";
import { getSidebarMenuItems } from "@/services/menuHelper";
import AppShell from "./AppShell";

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((s: RootState) => s.auth.user);

  const isLogin = pathname === "/login";
  const [isVerifying, setIsVerifying] = useState(!isLogin);

  useEffect(() => {
    if (isLogin) {
      setIsVerifying(false);
      return;
    }

    if (user) {
      setIsVerifying(false);
      return;
    }

    let mounted = true;
    setIsVerifying(true);

    (async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.CURRENT_USER, { withCredentials: true });
        if (!mounted) return;
        if (res.data?.success && res.data.user) {
          dispatch(setUser(res.data.user));
        } else {
          router.push("/login");
        }
      } catch {
        if (mounted) router.push("/login");
      } finally {
        if (mounted) setIsVerifying(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [dispatch, isLogin, router, user]);

  const handleLogout = useCallback(async () => {
    try {
      await axios.post(API_ENDPOINTS.LOGOUT, {}, { withCredentials: true });
    } catch {
      /* ignore */
    }
    dispatch(logout());
    router.push("/login");
  }, [dispatch, router]);

  if (isLogin) {
    return <>{children}</>;
  }

  if (isVerifying || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Loading workspace…</p>
        </div>
      </div>
    );
  }

  const menuItems = getSidebarMenuItems(user);
  const dashboardEntry = menuItems.find((m) => m.label.toLowerCase() === "dashboard");
  const brandHref = dashboardEntry?.href ?? menuItems[0]?.href ?? "/";

  return (
    <AppShell menuItems={menuItems} user={user} brandHref={brandHref} onLogout={handleLogout}>
      {children}
    </AppShell>
  );
}
