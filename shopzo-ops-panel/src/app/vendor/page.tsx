"use client";

import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { setVendors, deleteVendor } from "@/store/slices/vendorSlice";
import { Vendor } from "@/store/types/vendor";
import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "@/lib/api";
import axios from "axios";
import { toast } from "react-toastify";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppDispatch } from "@/store";


const VendorPage = () => {

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const vendors = useSelector((state: RootState) => state.vendor.vendors);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  const fetchVendors = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(API_ENDPOINTS.GET_VENDORS, { withCredentials: true });
      if (response.data.success) {
        dispatch(setVendors(response.data.vendors));
      }
    }
    catch (error) {
      console.error("Error fetching vendors:", error);
      setError("Failed to fetch vendors. Please try again.");
      toast.error("Failed to fetch vendors. Please try again.");
    }
    finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await axios.delete(`${API_ENDPOINTS.DELETE_VENDOR}/${id}`, { withCredentials: true });
      if (response.data.success) {
        dispatch(deleteVendor(id));
        toast.success("Vendor deleted successfully");
      } else {
        toast.error(response.data.message || "Failed to delete vendor");
      }
    }
    catch (error) {
      console.error("Error deleting vendor:", error);
      toast.error("Failed to delete vendor. Please try again.");
    }
  }
  useEffect(() => {
    if (!vendors || vendors.length === 0) {
      fetchVendors();
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-slate-900 min-h-screen">
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Vendors</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage vendors and their details</p>
          </div>
          <Link
            href="/vendor/add"
            className="inline-flex items-center justify-center px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Vendor
          </Link>
        </div>


        {/* delete  modal */}
        {deleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Delete Vendor</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Are you sure you want to delete this vendor? This action cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <button
                    onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleDelete(selectedVendorId as string);
                    setDeleteModalOpen(false);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}


        {/* Vendors Table */}
        {vendors.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No vendors</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new vendor.</p>
            <div className="mt-6">
              <Link
                href="/vendor/add"
                className="inline-flex items-center px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Vendor
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Contact Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                  {vendors.map((vendor) => (
                    <tr key={vendor._id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center mr-3">
                            <svg className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{vendor.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                    {vendor.contactNumber || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                        <div className="truncate" title={vendor.address?.formatted || "N/A"}>
                          {vendor.address?.formatted || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => router.push(`/vendor/edit/${vendor._id}`)}
                          className="text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300 font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedVendorId(vendor._id);
                            setDeleteModalOpen(true);
                          }}
                          className="ml-4 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
    )
}

export default VendorPage;
