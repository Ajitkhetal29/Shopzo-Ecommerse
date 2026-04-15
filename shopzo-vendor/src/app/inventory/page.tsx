"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "@/app/lib/api";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import Link from "next/link";
import InventoryTransferModal from "./transfer/inventoryTransfer";

type variant = {
  name?: string;
  sku?: string;
  images?: { url?: string }[];
};

type Inventory = {
  _id: string;
  quantity: number;
  reserved?: number;
  available?: number;
  variant?: variant;
};

const PAGE_SIZES = [10, 20, 50, 100] as const;

export default function InventoryPage() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });
  const vendor = useSelector((state: RootState) => state.auth.vendor);
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedSku, setSelectedSku] = useState("");




  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!vendor?._id) {
        setError("Vendor not found");
        return;
      }

      const response = await axios.get(API_ENDPOINTS.INVENTORY_LIST, {
        params: {
          vendorId: vendor._id,
          limit: pagination.limit,
          page: pagination.page,
        },
        withCredentials: true,
      });


      if (response.data.success) {
        setInventory(response.data.inventory ?? []);
        setTotalCount(response.data.totalCount ?? 0);
      } else {
        setError(response.data.message);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendor?._id, pagination.page, pagination.limit]);

  const totalPages = Math.ceil(totalCount / pagination.limit) || 1;

  if (loading && inventory.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error && inventory.length === 0) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-slate-900 min-h-screen">
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Inventory</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Stock by variant · {totalCount} total
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            Products
          </Link>
          <button
            type="button"
            onClick={() => setIsTransferModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:opacity-90"
          >
            Create Transfer
          </button>
        </div>

        {error ? (
          <div className="mb-4 bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded">
            {error}
          </div>
        ) : null}

        {inventory.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-12 text-center">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">No inventory</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Nothing on this page.</p>
            <Link
              href="/products"
              className="mt-6 inline-flex px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium text-sm"
            >
              Go to products
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 text-sm">
                <thead className="bg-gray-50 dark:bg-slate-700/80">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Available
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Reserved
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {inventory.map((inv) => {
                    const qty = inv.quantity;
                    const resv = inv.reserved ?? 0;
                    const avail = inv.available ?? Math.max(0, qty - resv);

                    return (
                      <tr key={inv._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {inv.variant?.images?.[0]?.url ? (
                            <img
                              src={inv.variant.images[0].url}
                              onClick={() => {
                                setSelectedImage(inv.variant?.images?.[0]?.url ?? "");
                                setSelectedSku(inv.variant?.sku ?? "—");
                              }}
                              alt={inv.variant?.name ?? inv.variant?.sku ?? "Variant image"}
                              className="h-12 w-12 rounded-lg object-cover border border-gray-200 dark:border-slate-600 cursor-zoom-in"
                            />
                          ) : (
                            <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-400 text-xs">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-900 dark:text-white">
                          {inv.variant?.sku ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-900 dark:text-white">
                          {avail}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-300">
                          {resv}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-900 dark:text-white">
                          {qty}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-6">
              <label className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                Per page
                <select
                  value={pagination.limit}
                  onChange={(e) => {
                    const limit = Number(e.target.value);
                    setPagination({ page: 1, limit });
                  }}
                  className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white"
                >
                  {PAGE_SIZES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1 || loading}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-2 py-2 text-sm text-gray-600 dark:text-gray-400 tabular-nums">
                  Page {pagination.page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={pagination.page >= totalPages || loading}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => {
            setSelectedImage("");
            setSelectedSku("");
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <div
            className="relative flex items-center justify-center w-full h-full max-w-5xl max-h-[90vh] px-14"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full max-h-[85vh] flex items-center justify-center">
              <img src={selectedImage} alt="Selected inventory image" className="max-h-full max-w-full object-contain" />
            </div>
            {selectedSku && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-md bg-black/50 px-3 py-1.5 font-mono text-sm text-white">
                SKU: {selectedSku}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setSelectedImage("");
                setSelectedSku("");
              }}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center focus:outline-none"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <InventoryTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        inventory={inventory}
        vendorId={vendor?._id || ""}
        onCreated={() => {
          setIsTransferModalOpen(false);
          fetchInventory();
        }}
      />
    </div>
  );
}
