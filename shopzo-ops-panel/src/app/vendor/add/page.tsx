"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { addVendor } from "@/store/slices/vendorSlice";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "@/lib/api";
import axios from "axios";
import { Address } from "@/store/types/address";
import { getAddress } from "@/services/address";

const MapBase = dynamic(() => import("@/app/components/MapBase"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] items-center justify-center bg-slate-50 text-sm text-slate-500 dark:bg-slate-800/80 dark:text-slate-400">
      Loading map...
    </div>
  ),
});

export default function AddVendorPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [formdata, setFormdata] = useState({
    name: "",
    email: "",
    password: "",
    contactNumber: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  const inputClass =
    "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400";
  const disabledInputClass =
    "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-600 dark:bg-slate-600 dark:text-slate-500";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormdata({ ...formdata, [e.target.name]: e.target.value });
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (address) {
      setAddress({ ...address, [e.target.name]: e.target.value } as Address);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!formdata.name || !formdata.email || !formdata.password || !formdata.contactNumber) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!location) {
      toast.error("Please select a location on the map");
      return;
    }
    if (!address || !address.formatted || !address.state || !address.city || !address.pincode) {
      toast.error("Please ensure address is properly loaded");
      return;
    }

    setIsSubmitting(true);
    try {
      const vendorData = {
        name: formdata.name,
        email: formdata.email,
        password: formdata.password,
        contactNumber: formdata.contactNumber,
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

      const response = await axios.post(API_ENDPOINTS.CREATE_VENDOR, vendorData, {
        withCredentials: true,
      });

      if (response.data.success) {
        dispatch(addVendor(response.data.vendor));
        toast.success("Vendor added successfully");
        router.push("/vendor");
      } else {
        toast.error(response.data.message || "Failed to add vendor");
      }
    } catch (error: unknown) {
      console.error("Submit error:", error);
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Error adding vendor. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGetAddress = async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    try {
      const addressData = await getAddress({ lat, lng });
      if (addressData) {
        setAddress({
          ...addressData,
        });
      } else {
        toast.error("Failed to fetch address. Please try selecting the location again.");
      }
    } catch (error) {
      console.error("Error fetching address:", error);
      toast.error("Failed to fetch address. Please try selecting the location again.");
    } finally {
      setIsLoadingAddress(false);
    }
  };

  return (
    <div className="space-y-7 sm:space-y-8">
      <div className="border-b border-slate-200/80 pb-6 dark:border-slate-700/60">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-[2rem] lg:leading-tight">
          Add New Vendor
        </h1>
        <p className="mt-2 max-w-3xl text-[0.9375rem] leading-relaxed text-slate-600 dark:text-slate-400">
          Select a location and fill in vendor details to provision a new vendor account.
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
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Vendor Details</h2>
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

          <div className="space-y-5 p-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Vendor Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                name="name"
                value={formdata.name}
                onChange={handleChange}
                className={inputClass}
                placeholder="Enter vendor name"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                name="email"
                value={formdata.email}
                onChange={handleChange}
                className={inputClass}
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                name="password"
                value={formdata.password}
                onChange={handleChange}
                className={inputClass}
                placeholder="Enter password"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Contact Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={10}
                minLength={10}
                pattern="[0-9]*"
                name="contactNumber"
                value={formdata.contactNumber}
                onChange={handleChange}
                className={inputClass}
                placeholder="10 digit mobile number"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Landmark</label>
              <input
                type="text"
                name="landmark"
                onChange={handleAddressChange}
                disabled={isLoadingAddress}
                value={address?.landmark || ""}
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
                onChange={handleAddressChange}
                rows={3}
                disabled={isLoadingAddress}
                className={`w-full resize-none rounded-xl border px-3 py-2.5 text-sm shadow-sm transition-colors ${
                  isLoadingAddress
                    ? disabledInputClass
                    : "border-slate-300 bg-white text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                }`}
                placeholder={isLoadingAddress ? "Fetching address..." : "Address will be auto-filled"}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Area/Neighbourhood</label>
                <input
                  type="text"
                  name="area"
                  disabled={isLoadingAddress}
                  value={address?.area || ""}
                  onChange={handleAddressChange}
                  className={`${inputClass} ${isLoadingAddress ? disabledInputClass : ""}`}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  disabled={isLoadingAddress}
                  value={address?.city || ""}
                  onChange={handleAddressChange}
                  required
                  className={`${inputClass} ${isLoadingAddress ? disabledInputClass : ""}`}
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
                  disabled={isLoadingAddress}
                  value={address?.state || ""}
                  onChange={handleAddressChange}
                  required
                  className={`${inputClass} ${isLoadingAddress ? disabledInputClass : ""}`}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="pincode"
                  disabled={isLoadingAddress}
                  value={address?.pincode || ""}
                  onChange={handleAddressChange}
                  required
                  className={`${inputClass} ${isLoadingAddress ? disabledInputClass : ""}`}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Country</label>
              <input
                type="text"
                name="country"
                disabled={isLoadingAddress}
                value={address?.country || ""}
                onChange={handleAddressChange}
                className={`${inputClass} ${isLoadingAddress ? disabledInputClass : ""}`}
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200/80 pt-5 dark:border-slate-700">
              <button
                type="button"
                onClick={() => router.push("/vendor")}
                className="inline-flex h-10 items-center rounded-xl border border-slate-300 px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`inline-flex h-10 items-center rounded-xl px-5 text-sm font-semibold text-white shadow-sm transition-colors ${
                  isSubmitting
                    ? "cursor-not-allowed bg-amber-400"
                    : "bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                }`}
              >
                {isSubmitting ? "Submitting..." : "Add Vendor"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
