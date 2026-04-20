"use client";

import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { API_ENDPOINTS } from "@/lib/api";
import { setWarehouse } from "@/store/slices/authSlice";

type LoginMode = "mobile" | "email";

const LoginPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginMode, setLoginMode] = useState<LoginMode>("mobile");
  const [formData, setFormData] = useState({
    email: "",
    contactNumber: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload =
        loginMode === "mobile"
          ? { contactNumber: formData.contactNumber, password: formData.password }
          : { email: formData.email, password: formData.password };

      const res = await axios.post(API_ENDPOINTS.LOGIN, payload, {
        withCredentials: true,
      });

      if (!res.data?.success || !res.data?.warehouse) {
        setError(res.data?.message || "Login failed");
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
      router.push("/dashboard");
    } catch (submitError: unknown) {
      if (axios.isAxiosError(submitError)) {
        setError(submitError.response?.data?.message || "Login failed");
      } else {
        setError("Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-black mb-2">
          Warehouse Login
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Sign in to your Shopzo warehouse account
        </p>

        <div className="mb-4 grid grid-cols-2 rounded-lg border border-gray-200 p-1">
          <button
            type="button"
            onClick={() => {
              setLoginMode("mobile");
              setError("");
            }}
            className={`rounded-md py-2 text-sm font-medium transition-colors ${
              loginMode === "mobile"
                ? "bg-black text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            Mobile Number
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMode("email");
              setError("");
            }}
            className={`rounded-md py-2 text-sm font-medium transition-colors ${
              loginMode === "email"
                ? "bg-black text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            Email
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {loginMode === "mobile" ? (
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Contact Number
              </label>
              <input
                name="contactNumber"
                type="text"
                required
                value={formData.contactNumber}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    contactNumber: e.target.value,
                  }));
                  setError("");
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-black bg-white focus:ring-2 focus:ring-black transition-colors"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }));
                  setError("");
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-black bg-white focus:ring-2 focus:ring-black transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Password
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, password: e.target.value }));
                  setError("");
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-black bg-white focus:ring-2 focus:ring-black transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-2 text-gray-500"
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
