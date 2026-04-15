"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "@/lib/api";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { addWarehouse } from "@/store/slices/warehouseSlice";
import { Address } from "@/store/types/address";
import { getAddress } from "@/services/address";
import { useRouter } from "next/navigation";



const MapBase = dynamic(() => import("@/app/components/MapBase"), {
  ssr: false,
  loading: () => <div className="h-[500px] flex items-center justify-center">
    Loading map...
  </div>
});



export default function AddWarehousePage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [formdata, setFormdata] = useState({
    name: "",
    contactNumber: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);




  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormdata({ ...formdata, [e.target.name]: e.target.value });
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (address) {
      setAddress({ ...address, [e.target.name]: e.target.value } as Address);
    }
  }

    const handleSubmit = async () => {
    // Prevent double submit
    if (isSubmitting) return;

    // Validation
    if (!formdata.name || !formdata.contactNumber) {
      toast.error("Please fill in name and contact number");
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
      const warehouseData = {
        name: formdata.name,
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
        }
      };
      
      const response = await axios.post(API_ENDPOINTS.CREATE_WAREHOUSES, warehouseData, {
        withCredentials: true
      });

      if (response.data.success) {
        dispatch(addWarehouse(response.data.warehouse));
        toast.success("Warehouse added successfully");
        router.push("/warehouse");
      } else {
        toast.error(response.data.message || "Failed to add warehouse");
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(error.response?.data?.message || "Error adding warehouse. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }



  const handleGetAddress = async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    try {
      const addressData = await getAddress({ lat, lng });
      if (addressData) {
        // Preserve existing landmark if user has entered one
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Add New Warehouse</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Select a location on the map and fill in the warehouse details</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map Section */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Select Location</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Click on the map or search for an address</p>
            </div>
            <div className="h-[500px] w-full relative">
              <MapBase
                onLocationSelect={(lat, lng) => {
                  setLocation({ lat, lng });
                  handleGetAddress(lat, lng);
                }}
              />
            </div>
            {location && (  
              <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-t border-gray-200 dark:border-slate-700">
                <p className="text-xs font-medium text-blue-900 dark:text-blue-200">
                  Location Selected: <span className="text-blue-700 dark:text-blue-300">{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</span>
                </p>
              </div>
            )}
          </div>

          {/* Form Section */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 relative">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Warehouse Details</h2>
            </div>
            
            {isLoadingAddress && (
              <div className="absolute inset-0 bg-white dark:bg-slate-800 bg-opacity-95 dark:bg-opacity-95 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mb-4"></div>
                  <p className="text-base font-medium text-gray-900 dark:text-white">Fetching address details...</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Please wait while we load the address information</p>
                </div>
              </div>
            )}
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Warehouse Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required 
                  name="name" 
                  value={formdata.name} 
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-colors text-sm"
                  placeholder="Enter warehouse name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  className="w-full px-4 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-colors text-sm"
                  placeholder="10 digit mobile number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Landmark</label>
                <input 
                  type="text" 
                  name="landmark" 
                  onChange={handleAddressChange}
                  disabled={isLoadingAddress}
                  className={`w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-colors text-sm ${
                    isLoadingAddress 
                      ? "bg-gray-100 dark:bg-slate-600 text-gray-400 dark:text-gray-500 cursor-not-allowed" 
                      : "bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  }`}
                  placeholder="e.g., Near Metro Station"
                />
              </div>

              <div className="border-t border-gray-200 dark:border-slate-700 pt-5 mt-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Address Details</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Auto-filled from selected location</p>
                  </div>
                  {isLoadingAddress && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400"></div>
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Fetching address...</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Address <span className="text-red-500">*</span>
                </label>
                <textarea 
                  name="formatted" 
                  value={address?.formatted || ""} 
                  onChange={handleAddressChange}
                  rows={3}
                  disabled={isLoadingAddress}
                  className={`w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors text-sm resize-none ${
                    isLoadingAddress 
                      ? "bg-gray-100 dark:bg-slate-600 text-gray-400 dark:text-gray-500 cursor-not-allowed" 
                      : "bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  }`}
                  placeholder={isLoadingAddress ? "Fetching address..." : "Address will be auto-filled"}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Area/Neighbourhood</label>
                  <input 
                    type="text" 
                    name="area" 
                    disabled={isLoadingAddress} 
                    value={address?.area || ""} 
                    onChange={handleAddressChange}
                    className={`w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-colors text-sm ${
                      isLoadingAddress 
                        ? "bg-gray-100 dark:bg-slate-600 text-gray-400 dark:text-gray-500 cursor-not-allowed" 
                        : "bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="city" 
                    disabled={isLoadingAddress} 
                    value={address?.city || ""} 
                    onChange={handleAddressChange} 
                    required
                    className={`w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-colors text-sm ${
                      isLoadingAddress 
                        ? "bg-gray-100 dark:bg-slate-600 text-gray-400 dark:text-gray-500 cursor-not-allowed" 
                        : "bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="state" 
                    disabled={isLoadingAddress} 
                    value={address?.state || ""} 
                    onChange={handleAddressChange} 
                    required
                    className={`w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-colors text-sm ${
                      isLoadingAddress 
                        ? "bg-gray-100 dark:bg-slate-600 text-gray-400 dark:text-gray-500 cursor-not-allowed" 
                        : "bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="pincode" 
                    disabled={isLoadingAddress} 
                    value={address?.pincode || ""} 
                    onChange={handleAddressChange} 
                    required
                    className={`w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-colors text-sm ${
                      isLoadingAddress 
                        ? "bg-gray-100 dark:bg-slate-600 text-gray-400 dark:text-gray-500 cursor-not-allowed" 
                        : "bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Country</label>
                <input 
                  type="text" 
                  name="country" 
                  disabled={isLoadingAddress} 
                  value={address?.country || ""} 
                  onChange={handleAddressChange}
                  className={`w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-colors text-sm ${
                    isLoadingAddress 
                      ? "bg-gray-100 dark:bg-slate-600 text-gray-400 dark:text-gray-500 cursor-not-allowed" 
                      : "bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  }`}
                />
              </div>

              <button 
                type="submit" 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`w-full mt-6 px-6 py-3 rounded-lg font-medium text-sm transition-all ${
                  isSubmitting 
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:ring-offset-2 shadow-sm"
                }`}
              >
                {isSubmitting ? "Submitting..." : "Add Warehouse"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}