"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { API_ENDPOINTS } from '@/lib/api';
import axios from 'axios';
import { updateVendor, setVendors } from '@/store/slices/vendorSlice';
import { Vendor } from '@/store/types/vendor';
import { getAddress } from '@/services/address';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Address } from '@/store/types/address';
import { toast } from 'react-toastify';



const MapBase = dynamic(() => import("@/app/components/MapBase"), {
    ssr: false,
    loading: () => <div className="h-[500px] flex items-center justify-center">
        Loading map...
    </div>
});

const EditVendorPage = ({ }) => {
    const params = useParams();
    const router = useRouter();
    const id = params.id;

    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [address, setAddress] = useState<Address | null>(null);
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);


    const vendors = useSelector((state: RootState) => state.vendor.vendors);
    const vendor = vendors.find(v => v._id === id);
    const hasFetched = useRef(false);

    const [formData, setFormData] = useState<Vendor | null>(null);

    useEffect(() => {
        if (vendor) {
            setLocation({ lat: vendor.location.lat, lng: vendor.location.lng });
            setFormData(vendor);
            // Properly set address with all fields
            if (vendor.address) {
                setAddress({
                    formatted: vendor.address.formatted || '',
                    city: vendor.address.city || '',
                    state: vendor.address.state || '',
                    pincode: vendor.address.pincode || '',
                    area: vendor.address.area || '',
                    country: vendor.address.country || '',
                    landmark: vendor.address.landmark || '',
                });
            }
        } else if (id && !hasFetched.current && (!vendors || vendors.length === 0)) {
            // If vendor not in Redux and vendors array is empty, fetch all vendors
            hasFetched.current = true;
            setLoading(true);
            axios.get(API_ENDPOINTS.GET_VENDORS, {
                withCredentials: true,
            })
            .then((response) => {
                if (response.data.success && response.data.vendors) {
                    dispatch(setVendors(response.data.vendors));
                    const foundVendor = response.data.vendors.find((v: Vendor) => v._id === id);
                    if (foundVendor) {
                        setLocation({ lat: foundVendor.location.lat, lng: foundVendor.location.lng });
                        setFormData(foundVendor);
                        // Properly set address with all fields
                        if (foundVendor.address) {
                            setAddress({
                                formatted: foundVendor.address.formatted || '',
                                city: foundVendor.address.city || '',
                                state: foundVendor.address.state || '',
                                pincode: foundVendor.address.pincode || '',
                                area: foundVendor.address.area || '',
                                country: foundVendor.address.country || '',
                                landmark: foundVendor.address.landmark || '',
                            });
                        }
                    } else {
                        setError("Vendor not found");
                    }
                }
            })
            .catch((err: any) => {
                const errorMessage = err.response?.data?.message || "Failed to fetch vendor";
                setError(errorMessage);
            })
            .finally(() => {
                setLoading(false);
            });
        }
    }, [vendor, id, vendors, dispatch]);

    const handleGetAddress = async (lat: number, lng: number) => {
        setIsLoadingAddress(true);
        try {
            const newAddress = await getAddress({ lat, lng });
            if (newAddress) {
                // Preserve existing landmark if user has entered one
                setAddress({
                    ...newAddress,
                    landmark: address?.landmark || (newAddress as Address).landmark || '',
                } as Address);
            }
        } catch (error) {
            console.error("Error fetching address:", error);
        } finally {
            setIsLoadingAddress(false);
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (formData) {
            if (e.target.name === 'landmark') {
                setFormData({
                    ...formData,
                    address: {
                        ...formData.address,
                        landmark: e.target.value,
                    }
                });
            } else {
            setFormData({
                ...formData,
                [e.target.name]: e.target.value,
            });
            }
        }
    };

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (address) {
            setAddress({ ...address, [e.target.name]: e.target.value } as Address);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData || !location || !address) return;
        
        // Validate required fields
        if (!address.formatted || !address.state || !address.city || !address.pincode) {
            setError("Please ensure all address fields are filled");
            toast.error("Please ensure all address fields are filled");
            return;
        }

        setLoading(true);
        try {
            const updateData = {
                name: formData.name,
                email: formData.email,
                contactNumber: formData.contactNumber,
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

            const response = await axios.put(`${API_ENDPOINTS.UPDATE_VENDOR}/${id}`, updateData, {
                withCredentials: true,
            });

            if (response.status === 200 && response.data.success) {
                dispatch(updateVendor(response.data.vendor));
                toast.success("Vendor updated successfully");
                router.push(`/vendor`);
            } else {
                setError(response.data.message || "Failed to update vendor");
                toast.error(response.data.message || "Failed to update vendor");
            }

            setError("");
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || "Failed to update vendor";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !formData) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center transition-colors">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mb-4"></div>
                    <p className="text-base font-medium text-gray-900 dark:text-white">Loading vendor data...</p>
                </div>
            </div>
        );
    }

    if (error && !formData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button 
                        onClick={() => router.push('/vendor')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Back to Vendors
                    </button>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Edit Vendor</h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Update the location on the map or modify the vendor details</p>
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
                            defaultPosition={location ? [location.lat, location.lng] : undefined}
                             onLocationSelect={(lat, lng) => {
                                setLocation({ lat, lng });

                                handleGetAddress(lat, lng);
                            }} />
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
                            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Vendor Details</h2>
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

                        {error && (
                            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}




            <form onSubmit={handleSubmit}>
                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Vendor Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData?.name || ''}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-colors text-sm"
                                        placeholder="Enter vendor name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData?.email || ''}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-colors text-sm"
                                        placeholder="Enter email address"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Contact Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="contactNumber"
                                        name="contactNumber"
                                        value={formData?.contactNumber || ''}
                                        onChange={handleInputChange}
                                        maxLength={10}
                                        minLength={10}
                                        pattern="[0-9]*"
                                        className="w-full px-4 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-colors text-sm"
                                        placeholder="10 digit mobile number"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Landmark</label>
                                    <input
                                        type="text"
                                        id="landmark"
                                        name="landmark"
                                        value={formData?.address?.landmark || ''}
                                        onChange={handleInputChange}
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

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Full Address <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="formatted"
                                        value={address?.formatted || ''}
                                        rows={3}
                                        disabled
                                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-colors text-sm resize-none bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                                        placeholder="Address will be auto-filled"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Area/Neighbourhood</label>
                                        <input
                                            type="text"
                                            name="area"
                                            disabled
                                            value={address?.area || ''}
                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-colors text-sm bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            City <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="city"
                                            disabled
                                            value={address?.city || ''}
                                            required
                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-colors text-sm bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-gray-400 cursor-not-allowed"
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
                                            disabled
                                            value={address?.state || ''}
                                            required
                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-colors text-sm bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Pincode <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="pincode"
                                            disabled
                                            value={address?.pincode || ''}
                                            required
                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-colors text-sm bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Country</label>
                                    <input
                                        type="text"
                                        name="country"
                                        disabled
                                        value={address?.country || ''}
                                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors text-sm bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => router.push('/vendor')}
                                        className="px-6 py-3 rounded-lg font-medium text-sm transition-all bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-slate-500 focus:ring-offset-2"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || isLoadingAddress}
                                        className={`flex-1 px-6 py-3 rounded-lg font-medium text-sm transition-all ${
                                            loading || isLoadingAddress
                                                ? "bg-gray-400 text-white cursor-not-allowed"
                                                : "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:ring-offset-2 shadow-sm"
                                        }`}
                                    >
                                        {loading ? "Updating..." : "Update Vendor"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EditVendorPage;
