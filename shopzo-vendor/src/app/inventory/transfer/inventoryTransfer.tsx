"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";

type InventoryVariant = {
  _id?: string;
  sku?: string;
  name?: string;
};

type InventoryItem = {
  _id: string;
  quantity: number;
  reserved?: number;
  available?: number;
  variant?: InventoryVariant;
};

type Warehouse = {
  _id: string;
  name: string;
};

type TransferRow = {
  variantId: string;
  quantity: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  vendorId: string;
  onCreated?: () => void;
};

const INVENTORY_TRANSFER_CREATE_API = "http://localhost:8000/api/inventoryTransfer/create";
const WAREHOUSE_LIST_API = "http://localhost:8000/api/warehouse/list";

export default function InventoryTransferModal({
  isOpen,
  onClose,
  inventory,
  vendorId,
  onCreated,
}: Props) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [toId, setToId] = useState("");
  const [rows, setRows] = useState<TransferRow[]>([{ variantId: "", quantity: 1 }]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const variantOptions = useMemo(() => {
    return inventory
      .map((inv) => ({
        variantId: inv.variant?._id ?? "",
        label: inv.variant?.sku || inv.variant?.name || inv.variant?._id || "Unknown",
        available: inv.available ?? Math.max(0, inv.quantity - (inv.reserved ?? 0)),
      }))
      .filter((v) => !!v.variantId);
  }, [inventory]);

  const getAvailableForVariant = (variantId: string) => {
    const match = variantOptions.find((v) => v.variantId === variantId);
    return match?.available ?? 0;
  };

  useEffect(() => {
    if (!isOpen) return;

    const loadWarehouses = async () => {
      try {
        setLoadingWarehouses(true);
        setError("");
        const response = await axios.get(WAREHOUSE_LIST_API, { withCredentials: true });
        if (response.data?.success) {
          setWarehouses(response.data.warehouses || []);
        } else {
          setError(response.data?.message || "Failed to load warehouses");
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load warehouses";
        setError(message);
      } finally {
        setLoadingWarehouses(false);
      }
    };

    loadWarehouses();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setToId("");
      setRows([{ variantId: "", quantity: 1 }]);
      setError("");
      setSuccess("");
    }
  }, [isOpen]);

  const addRow = () => {
    setRows((prev) => [...prev, { variantId: "", quantity: 1 }]);
  };

  const removeRow = (index: number) => {
    setRows((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateRow = (index: number, key: keyof TransferRow, value: string | number) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [key]: value } : row))
    );
  };

  const validateForm = () => {
    if (!vendorId) return "Vendor is required";
    if (!toId) return "Please select warehouse";
    if (rows.length === 0) return "Please add at least one item";

    const seen = new Set<string>();
    for (const row of rows) {
      if (!row.variantId) return "Please select variant for each row";
      if (!Number.isInteger(row.quantity) || row.quantity <= 0) {
        return "Quantity must be a positive whole number";
      }

      if (seen.has(row.variantId)) return "Duplicate variant is not allowed";
      seen.add(row.variantId);

      const available = getAvailableForVariant(row.variantId);
      if (row.quantity > available) {
        return "Quantity cannot be more than available stock";
      }
    }

    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        variantsData: rows.map((r) => ({
          variantId: r.variantId,
          quantity: Number(r.quantity),
        })),
        fromType: "vendor",
        fromId: vendorId,
        toType: "warehouse",
        toId,
      };

      const response = await axios.post(INVENTORY_TRANSFER_CREATE_API, payload, {
        withCredentials: true,
      });

      if (response.data?.success) {
        setSuccess("Transfer request created");
        onCreated?.();
      } else {
        setError(response.data?.message || "Failed to create transfer request");
      }
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err)
          ? err.response?.data?.message || err.message
          : err instanceof Error
            ? err.message
            : "Failed to create transfer request";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create Transfer Request
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-1 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error ? (
            <div className="rounded-md border border-red-300 bg-red-50 text-red-700 text-sm px-3 py-2">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-md border border-green-300 bg-green-50 text-green-700 text-sm px-3 py-2">
              {success}
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Select Warehouse
            </label>
            <select
              value={toId}
              onChange={(e) => setToId(e.target.value)}
              disabled={loadingWarehouses}
              className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
            >
              <option value="">{loadingWarehouses ? "Loading..." : "Choose warehouse"}</option>
              {warehouses.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            {rows.map((row, index) => {
              const available = getAvailableForVariant(row.variantId);
              return (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 rounded-lg border border-gray-200 dark:border-slate-700 p-3"
                >
                  <div className="md:col-span-7">
                    <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">
                      Variant
                    </label>
                    <select
                      value={row.variantId}
                      onChange={(e) => updateRow(index, "variantId", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                    >
                      <option value="">Choose variant</option>
                      {variantOptions.map((v) => (
                        <option key={v.variantId} value={v.variantId}>
                          {v.label} (Available: {v.available})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={row.quantity}
                      onChange={(e) => updateRow(index, "quantity", Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                    />
                    {row.variantId ? (
                      <p className="mt-1 text-[11px] text-gray-500">Available: {available}</p>
                    ) : null}
                  </div>

                  <div className="md:col-span-2 flex items-end">
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="w-full rounded-lg border border-red-300 text-red-600 px-3 py-2 text-sm disabled:opacity-50"
                      disabled={rows.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addRow}
            className="rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm"
          >
            + Add Variant
          </button>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-sm disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Transfer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
