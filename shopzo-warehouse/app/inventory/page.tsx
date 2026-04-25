"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "@/lib/api";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { sellableAvailable } from "@/lib/inventoryDisplay";

type InventoryRow = {
  _id: string;
  quantity: number;
  available: number;
  reserved?: number;
  missingHold?: number;
  damagedQty?: number;
  extraHold?: number;
  variant?: {
    name?: string;
    sku?: string;
  };
  warehouse?: {
    name?: string;
  };
};

export default function InventoryPage() {
  const warehouse = useSelector((state: RootState) => state.auth.warehouse);
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadInventory = async () => {
      try {
        setLoading(true);

        let warehouseId = warehouse?._id;
        if (!warehouseId) {
          const meRes = await axios.get(API_ENDPOINTS.CURRENT_USER, {
            withCredentials: true,
          });
          warehouseId = meRes.data?.warehouse?._id;
        }

        if (!warehouseId) {
          setError("Warehouse mapping not found for current user");
          setRows([]);
          return;
        }

        const res = await axios.get(API_ENDPOINTS.GET_INVENTORY, {
          params: {
            warehouseId,
          },
          withCredentials: true,
        });
        if (!isMounted) return;
        setRows(res.data?.inventory ?? []);
      } catch (loadError) {
        if (!isMounted) return;
        if (axios.isAxiosError(loadError)) {
          setError(loadError.response?.data?.message || "Failed to load inventory");
        } else {
          setError("Failed to load inventory");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInventory();
    return () => {
      isMounted = false;
    };
  }, [warehouse?._id]);

  if (loading && rows.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error && rows.length === 0) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-slate-900 min-h-screen">
        <div className="max-w-7xl mx-auto bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
            Inventory
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Available = sellable · Damaged / extra hold are not sellable until resolved
          </p>
        </div>

        {error ? (
          <div className="mb-4 bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded">
            {error}
          </div>
        ) : null}

        {rows.length === 0 && !loading ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-12 text-center">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              No inventory
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Nothing on this page.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700/80">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Variant
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Available
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Reserved
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Missing
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Damaged
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Extra hold
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {rows.map((row) => (
                  <tr key={row._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 font-mono text-gray-900 dark:text-white">
                      {row.variant?.sku || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">
                      {row.variant?.name || "-"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-900 dark:text-white">
                      {sellableAvailable(row)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-300">
                      {row.reserved || 0}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-amber-700 dark:text-amber-400">
                      {row.missingHold ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-orange-700 dark:text-orange-400">
                      {row.damagedQty ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-violet-700 dark:text-violet-400">
                      {row.extraHold ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-900 dark:text-white">
                      {row.quantity || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
