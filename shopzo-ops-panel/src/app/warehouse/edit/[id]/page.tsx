"use client";
import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { API_ENDPOINTS } from "@/lib/api";
import axios from "axios";
import { setWarehouses, updateWarehouse } from "@/store/slices/warehouseSlice";
import { Warehouse } from "@/store/types/warehouse";
import { getAddress } from "@/services/address";
import dynamic from "next/dynamic";
import { Address } from "@/store/types/address";

const MapBase = dynamic(() => import("@/app/components/MapBase"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] items-center justify-center bg-slate-50 text-sm text-slate-500 dark:bg-slate-800/80 dark:text-slate-400">
      Loading map...
    </div>
  ),
});

const EditWarehousePage = () => {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [address, setAddress] = useState<Address | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  const warehouses = useSelector((state: RootState) => state.warehouse.warehouses);
  const warehouse = warehouses.find((w) => w._id === id);
  const hasFetched = useRef(false);

  const [formData, setFormData] = useState<Warehouse | null>(null);

  const inputClass =
    "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400";
  const disabledInputClass =
    "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-600 dark:bg-slate-600 dark:text-slate-500";

  useEffect(() => {
    if (warehouse) {
      setLocation({ lat: warehouse.location.lat, lng: warehouse.location.lng });
      setFormData(warehouse);
      if (warehouse.address) {
        setAddress({
          formatted: warehouse.address.formatted || "",
          city: warehouse.address.city || "",
          state: warehouse.address.state || "",
          pincode: warehouse.address.pincode || "",
          area: warehouse.address.area || "",
          country: warehouse.address.country || "",
          landmark: warehouse.address.landmark || "",
        });
      }
      return;
    }

    if (!id || hasFetched.current || (warehouses && warehouses.length > 0)) return;

    hasFetched.current = true;
    setLoading(true);
    axios
      .get(API_ENDPOINTS.GET_WAREHOUSES, {
        withCredentials: true,
      })
      .then((response) => {
        if (response.data.success && response.data.warehouses) {
          dispatch(setWarehouses(response.data.warehouses));
          const foundWarehouse = response.data.warehouses.find((w: Warehouse) => w._id === id);
          if (!foundWarehouse) {
            setError("Warehouse not found");
            return;
          }
          setLocation({ lat: foundWarehouse.location.lat, lng: foundWarehouse.location.lng });
          setFormData(foundWarehouse);
          if (foundWarehouse.address) {
            setAddress({
              formatted: foundWarehouse.address.formatted || "",
              city: foundWarehouse.address.city || "",
              state: foundWarehouse.address.state || "",
              pincode: foundWarehouse.address.pincode || "",
              area: foundWarehouse.address.area || "",
              country: foundWarehouse.address.country || "",
              landmark: foundWarehouse.address.landmark || "",
            });
          }
        }
      })
      .catch((err: unknown) => {
        const errorMessage =
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : "Failed to fetch warehouse";
        setError(errorMessage);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [warehouse, id, warehouses, dispatch]);

  const handleGetAddress = async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    try {
      const newAddress = await getAddress({ lat, lng });
      if (newAddress) {
        setAddress({
          ...newAddress,
          landmark: address?.landmark || (newAddress as Address).landmark || "",
        } as Address);
      }
    } catch (err) {
      console.error("Error fetching address:", err);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!formData) return;
    if (e.target.name === "landmark") {
      const value = e.target.value;
      setAddress((prev) => (prev ? { ...prev, landmark: value } : prev));
      return;
    }
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !location || !address) return;

    if (!address.formatted || !address.state || !address.city || !address.pincode) {
      setError("Please ensure all address fields are filled");
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        name: formData.name,
        contactNumber: formData.contactNumber,
        email: formData.email?.trim() || undefined,
        password: formData.password?.trim() || undefined,
        location: {
          lat: location.lat,
          lng: location.lng,
        },
        address: {
          formatted: address.formatted,
          state: address.state,
          city: address.city,
          pincode: address.pincode,
          landmark: address.landmark || undefined,
        },
      };

      const response = await axios.put(`${API_ENDPOINTS.UPDATE_WAREHOUSES}/${id}`, updateData, {
        withCredentials: true,
      });

      if (response.status === 200 && response.data.success) {
        dispatch(updateWarehouse(response.data.warehouse));
        router.push("/warehouse");
        return;
      }

      setError(response.data.message || "Failed to update warehouse");
    } catch (err: unknown) {
      const errorMessage =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Failed to update warehouse";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading warehouse data...</p>
        </div>
      </div>
    );
  }

  if (error && !formData) {
    return (
      <div className="py-10">
        <div className="mx-auto max-w-xl rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-5 text-center dark:border-red-900/50 dark:bg-red-950/40">
          <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
          <button
            onClick={() => router.push("/warehouse")}
            className="mt-4 inline-flex h-10 items-center rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
          >
            Back to Warehouses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 sm:space-y-8">
      <div className="border-b border-slate-200/80 pb-6 dark:border-slate-700/60">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-[2rem] lg:leading-tight">
          Edit Warehouse
        </h1>
        <p className="mt-2 max-w-3xl text-[0.9375rem] leading-relaxed text-slate-600 dark:text-slate-400">
          Update location details and warehouse credentials from a single form.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-card shadow-sm dark:border-slate-600/80 dark:bg-slate-800/80">
          <div className="border-b border-slate-200/80 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-700/50">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Select Location</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Click on map or search an address</p>
          </div>
          <div className="relative h-[500px] w-full">
            <MapBase
              defaultPosition={location ? [location.lat, location.lng] : undefined}
              onLocationSelect={(lat, lng) => {
                setLocation({ lat, lng });
                handleGetAddress(lat, lng);
              }}
            />
          </div>
          {location ? (
            <div className="border-t border-slate-200/80 bg-amber-50/70 px-6 py-3 dark:border-slate-700 dark:bg-amber-900/20">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                Location Selected:{" "}
                <span className="font-medium text-amber-700 dark:text-amber-300">
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </span>
              </p>
            </div>
          ) : null}
        </div>

        <div className="relative rounded-2xl border border-slate-200/80 bg-card shadow-sm dark:border-slate-600/80 dark:bg-slate-800/80">
          <div className="border-b border-slate-200/80 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-700/50">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Warehouse Details</h2>
          </div>

          {isLoadingAddress ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/95 backdrop-blur-sm dark:bg-slate-800/95">
              <div className="text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Fetching address details...</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Please wait while we load address information
                </p>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="mx-6 mt-4 rounded-lg border border-red-200/80 bg-red-50/90 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit}>
            <div className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Warehouse Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData?.name || ""}
                  onChange={handleInputChange}
                  className={inputClass}
                  placeholder="Enter warehouse name"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="contactNumber"
                  name="contactNumber"
                  value={formData?.contactNumber || ""}
                  onChange={handleInputChange}
                  maxLength={10}
                  minLength={10}
                  pattern="[0-9]*"
                  className={inputClass}
                  placeholder="10 digit mobile number"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Email (Optional)</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData?.email || ""}
                  onChange={handleInputChange}
                  className={inputClass}
                  placeholder="warehouse@example.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">New Password (Optional)</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData?.password || ""}
                  onChange={handleInputChange}
                  className={inputClass}
                  placeholder="Leave blank to keep current password"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Landmark</label>
                <input
                  type="text"
                  id="landmark"
                  name="landmark"
                  value={address?.landmark || ""}
                  onChange={handleInputChange}
                  disabled={isLoadingAddress}
                  className={`${inputClass} ${isLoadingAddress ? disabledInputClass : ""}`}
                  placeholder="e.g., Near Metro Station"
                />
              </div>

              <div className="border-t border-slate-200/80 pt-5 dark:border-slate-700">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Address Details</h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Auto-filled from selected location</p>
                  </div>
                  {isLoadingAddress ? (
                    <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 dark:border-amber-800/80 dark:bg-amber-900/20">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-600 border-t-transparent dark:border-amber-400" />
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Fetching address...</span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Full Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="formatted"
                  value={address?.formatted || ""}
                  rows={3}
                  disabled
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-500 shadow-sm dark:border-slate-600 dark:bg-slate-600 dark:text-slate-400"
                  placeholder="Address will be auto-filled"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Area/Neighbourhood</label>
                  <input
                    type="text"
                    name="area"
                    disabled
                    value={address?.area || ""}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm shadow-sm ${disabledInputClass}`}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    disabled
                    value={address?.city || ""}
                    required
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm shadow-sm ${disabledInputClass}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    disabled
                    value={address?.state || ""}
                    required
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm shadow-sm ${disabledInputClass}`}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    disabled
                    value={address?.pincode || ""}
                    required
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm shadow-sm ${disabledInputClass}`}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Country</label>
                <input
                  type="text"
                  name="country"
                  disabled
                  value={address?.country || ""}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm shadow-sm ${disabledInputClass}`}
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200/80 pt-5 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => router.push("/warehouse")}
                  className="inline-flex h-10 items-center rounded-xl border border-slate-300 px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || isLoadingAddress}
                  className={`inline-flex h-10 items-center rounded-xl px-5 text-sm font-semibold text-white shadow-sm transition-colors ${
                    loading || isLoadingAddress
                      ? "cursor-not-allowed bg-amber-400"
                      : "bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  }`}
                >
                  {loading ? "Updating..." : "Update Warehouse"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditWarehousePage;
