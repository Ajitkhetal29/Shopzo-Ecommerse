"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";
import { API_ENDPOINTS } from "@/lib/api";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { setUser, logout } from "@/store/slices/authSlice";
import Link from "next/link";
import { getheaderMenuItems } from "@/services/menuHelper";

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [error, setError] = useState("");
  const dispatch = useDispatch();

  const user = useSelector((state: RootState) => state.auth.user);
  const [isVerifying, setIsVerifying] = useState(true);

  const menuItems = getheaderMenuItems(user);

  // Verify auth on mount and restore user state
  useEffect(() => {
    // Skip if on login page
    if (pathname === "/login") {
      setIsVerifying(false);
      return;
    }

    // If we already have user, skip verification
    // But if on root page, redirect to dashboard
    if (user) {
      setIsVerifying(false);
      if (pathname === "/") {
        router.push( `/dashboards/admin`);
      }
      return;
    }

    let isMounted = true;

    const verifyAuth = async () => {
      setIsVerifying(true);
      try {
        const res = await axios.get(API_ENDPOINTS.CURRENT_USER, {
          withCredentials: true,
        });
        if (isMounted) {
          if (res.data.success && res.data.user) {
            const verifiedUser = res.data.user;
            dispatch(setUser(verifiedUser));
          
            // If on root page, redirect to dashboard based on role
            if (pathname === "/") {
              router.push( `/dashboards/admin`);
            }
          } else {
            // Not authenticated, redirect to login
            router.push("/login");
          }
        }
      } catch (err) {
        // Not authenticated, redirect to login
        if (isMounted) {
          router.push("/login");
        }
      } finally {
        if (isMounted) {
          setIsVerifying(false);
        }
      }
    };

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, [dispatch, pathname, router, user]);

  const handleLogout = async () => {
    try {
      const res = await axios.post(API_ENDPOINTS.LOGOUT, {}, {
        withCredentials: true,
      });

      if (res.status === 200) {
        dispatch(logout());
        router.push("/login");
      } else {
        console.log(res.data.message);
        setError(res.data.message);
      }
    } catch (error: any) {
      setError(error.message);
    }
  };



  if (pathname === "/login") return null;

  if (isVerifying) {
    return (
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="h-6 w-32 bg-gray-200 dark:bg-slate-700 animate-pulse rounded"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 shadow-sm sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href={`/dashboards/admin`} className="text-xl font-bold text-black dark:text-white">
              Shopzo Ops Panel
            </Link>
          </div>

          {/* Navigation Menu - Desktop */}
          <nav className="hidden md:flex items-center space-x-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  href={item.href}
                  key={item.label}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-black dark:bg-white text-white dark:text-black"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Info & Actions */}
          <div className="flex items-center space-x-4">
            {user && (
              <div className="hidden sm:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {user.department.name} • {user.role.name}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-black dark:bg-white flex items-center justify-center">
                  <span className="text-white dark:text-black text-sm font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            )}
            
            {error && (
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
            )}
            
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Logout
            </button>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200 dark:border-slate-700 py-2">
          <nav className="flex flex-wrap gap-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  href={item.href}
                  key={item.label}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-black dark:bg-white text-white dark:text-black"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
