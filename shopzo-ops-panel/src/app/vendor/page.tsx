"use client";

import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { setVendors, deleteVendor } from "@/store/slices/vendorSlice";
import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "@/lib/api";
import axios from "axios";
import { toast } from "react-toastify";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setError("Failed to fetch vendors. Please try again.");
      toast.error("Failed to fetch vendors. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await axios.delete(`${API_ENDPOINTS.DELETE_VENDOR}/${id}`, { withCredentials: true });
      if (response.data.success) {
        dispatch(deleteVendor(id));
        toast.success("Vendor deleted successfully");
      } else {
        toast.error(response.data.message || "Failed to delete vendor");
      }
    } catch (error) {
      console.error("Error deleting vendor:", error);
      toast.error("Failed to delete vendor. Please try again.");
    }
  };

  useEffect(() => {
    if (!vendors || vendors.length === 0) {
      fetchVendors();
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading vendors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 sm:space-y-8">
      <div className="border-b border-slate-200/80 pb-6 dark:border-slate-700/60">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-[2rem] lg:leading-tight">
              Vendors
            </h1>
            <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-slate-600 dark:text-slate-400">
              Manage vendor accounts, contact details, and location records.
            </p>
          </div>
          <Link
            href="/vendor/add"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-700"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Vendor
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {deleteModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">Delete Vendor</h2>
            <p className="mb-6 text-slate-600 dark:text-slate-400">
              Are you sure you want to delete this vendor? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDelete(selectedVendorId as string);
                  setDeleteModalOpen(false);
                }}
                className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {vendors.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-card p-12 text-center shadow-sm dark:border-slate-600/80 dark:bg-slate-800/80">
          <svg className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5V4H2v16h5m10 0v-4c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v4m10 0H7m3-13h4m-4 4h4" />
          </svg>
          <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">No vendors</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Get started by creating a new vendor.</p>
          <div className="mt-6">
            <Link
              href="/vendor/add"
              className="inline-flex h-10 items-center rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-700"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Vendor
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-card shadow-sm dark:border-slate-600/80 dark:bg-slate-800/80">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Contact Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800/80">
                {vendors.map((vendor) => (
                  <tr key={vendor._id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20">
                          <svg className="h-5 w-5 text-amber-700 dark:text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5V4H2v16h5m10 0v-4c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v4m10 0H7m3-13h4m-4 4h4" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{vendor.name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {vendor.contactNumber || "N/A"}
                    </td>
                    <td className="max-w-xs px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      <div className="truncate" title={vendor.address?.formatted || "N/A"}>
                        {vendor.address?.formatted || "N/A"}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <button
                        onClick={() => router.push(`/vendor/edit/${vendor._id}`)}
                        className="font-semibold text-slate-700 transition-colors hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setSelectedVendorId(vendor._id);
                          setDeleteModalOpen(true);
                        }}
                        className="ml-4 font-semibold text-red-600 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
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
  );
};

export default VendorPage;
