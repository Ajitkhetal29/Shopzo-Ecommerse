"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "@/lib/api";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "@/store/slices/authSlice";
import { useRouter, usePathname } from "next/navigation";
import { RootState } from "@/store";

const LoginPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const user = useSelector((state: RootState) => state.auth.user);
  const hasRedirected = useRef(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  // Helper function to get department code
  const getDepartmentCode = (department: any): string => {
    if (!department) return "";
    if (typeof department === "string") return department.toLowerCase();
    if (department.code) return department.code.toLowerCase();
    if (department.name) return department.name.toLowerCase();
    return "";
  };

  // Redirect if already authenticated (only on login page)
  useEffect(() => {
    // Double check we're actually on login page before redirecting
    if (pathname !== "/login" || hasRedirected.current) return;
    
    if (user) {
      hasRedirected.current = true;
      const deptCode = getDepartmentCode(user.department);
      if (deptCode === "admin") router.push("/dashboards/admin");
      else if (deptCode === "delivery") router.push("/dashboards/delivery");
      else if (deptCode === "support") router.push("/dashboards/support");
      else if (deptCode === "vendor") router.push("/dashboards/vendor");
    }
  }, [user, router, pathname]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(API_ENDPOINTS.LOGIN, formData, {
        withCredentials: true,
      });

      if (!res.data.success) {
        setError(res.data.message || "Login failed");
        return;
      }

      const user = res.data.user;

      // ✅ Save user globally
      dispatch(setUser(user));

      // ✅ Role based navigation
      const deptCode = getDepartmentCode(user.department);
      if (deptCode === "admin") router.push("/dashboards/admin");
      else if (deptCode === "delivery") router.push("/dashboards/delivery");
      else if (deptCode === "support") router.push("/dashboards/support");
      else if (deptCode === "vendor") router.push("/dashboards/vendor");
      else setError("Invalid department. Contact admin.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700">
        <h1 className="text-3xl text-black dark:text-white font-bold text-center mb-2">
          Ops Panel Login
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
          Sign in to your Shopzo staff account
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black dark:text-gray-200 mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full border text-black dark:text-white bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-gray-200 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full border text-black dark:text-white bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 pr-10 focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-2 text-gray-500 dark:text-gray-400"
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
