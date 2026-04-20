"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { API_ENDPOINTS } from "@/lib/api";
import { WAREHOUSE_MENU_ITEMS } from "@/lib/menuHelper";
import { RootState } from "@/store";
import { logout, setWarehouse } from "@/store/slices/authSlice";

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const warehouse = useSelector((state: RootState) => state.auth.warehouse);
  const [error, setError] = useState("");
  const [hasCheckedAuth, setHasCheckedAuth] = useState(Boolean(warehouse));

  useEffect(() => {
    if (pathname === "/login") {
      return;
    }

    if (warehouse) {
      if (pathname === "/") {
        router.push("/dashboard");
      }
      return;
    }

    let isMounted = true;

    const verifyAuth = async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.CURRENT_USER, {
          withCredentials: true,
        });

        if (!isMounted) return;
        if (!res.data?.success || !res.data?.warehouse) {
          router.push("/login");
          return;
        }

        dispatch(
          setWarehouse({
            _id: res.data.warehouse._id,
            name: res.data.warehouse.name,
            email: res.data.warehouse.email,
            contactNumber: res.data.warehouse.contactNumber,
            address: res.data.warehouse.address,
            isActive: res.data.warehouse.isActive,
          }),
        );
        if (pathname === "/") {
          router.push("/dashboard");
        }
      } catch {
        if (isMounted) {
          router.push("/login");
        }
      } finally {
        if (isMounted) {
          setHasCheckedAuth(true);
        }
      }
    };

    verifyAuth();
    return () => {
      isMounted = false;
    };
  }, [dispatch, pathname, router, warehouse]);

  const handleLogout = async () => {
    try {
      await axios.post(API_ENDPOINTS.LOGOUT, {}, { withCredentials: true });
      dispatch(logout());
      router.push("/login");
    } catch (logoutError) {
      setError(
        logoutError instanceof Error ? logoutError.message : "Logout failed",
      );
    }
  };

  if (pathname === "/login") return null;

  const isVerifying = !warehouse && !hasCheckedAuth;

  if (isVerifying) {
    return (
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="h-6 w-40 bg-gray-200 dark:bg-slate-700 animate-pulse rounded" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 shadow-sm sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-black dark:text-white">
            Shopzo Warehouse
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            {WAREHOUSE_MENU_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-black dark:bg-white text-white dark:text-black"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {warehouse && (
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{warehouse.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Warehouse</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="md:hidden pb-3">
          <nav className="flex flex-wrap gap-2">
            {WAREHOUSE_MENU_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-black dark:bg-white text-white dark:text-black"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400 pb-3">{error}</p>}
      </div>
    </header>
  );
};

export default Header;
