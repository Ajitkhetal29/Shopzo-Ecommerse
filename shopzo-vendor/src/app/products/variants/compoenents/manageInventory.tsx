"use client";

import { API_ENDPOINTS } from "@/app/lib/api";
import { ProductVariant } from "@/store/types/product";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { sellableAvailable } from "@/lib/inventoryDisplay";

function rowVariantId(row: { variant: unknown }): string {
  const v = row.variant;
  if (v && typeof v === "object" && v !== null && "_id" in v) {
    return String((v as { _id: string })._id);
  }
  return String(v);
}

type PopulatedVariant = { _id?: string; name?: string; sku?: string };
type PopulatedVendor = { _id?: string; name?: string };

type InventoryListRow = {
  _id: string;
  quantity: number;
  reserved?: number;
  available?: number;
  missingHold?: number;
  damagedQty?: number;
  extraHold?: number;
  locationType?: string;
  variant?: PopulatedVariant | string;
  vendor?: PopulatedVendor | string;
};

type Props = {
  variant: ProductVariant | null;
  vendorId: string;
  vendorName: string;
  productName?: string;
  open: boolean;
  onClose: () => void;
};

function labelClass() {
  return "text-xs text-gray-500 dark:text-gray-400";
}

function valueClass() {
  return "text-sm text-gray-900 dark:text-white";
}

export default function ManageInventory({
  variant,
  vendorId,
  vendorName,
  productName,
  open,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false);
  /** Empty string = no value typed yet (new row); number = from server or user */
  const [quantity, setQuantity] = useState<number | "">("");
  const [inventoryId, setInventoryId] = useState<string | null>(null);
  const [row, setRow] = useState<InventoryListRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reserved = row?.reserved ?? 0;

  const qtyNum = quantity === "" ? 0 : Number(quantity);

  const availablePreview = useMemo(() => {
    if (row) {
      return sellableAvailable({
        quantity: qtyNum,
        reserved,
        missingHold: row.missingHold,
        damagedQty: row.damagedQty,
        extraHold: row.extraHold,
      });
    }
    return Math.max(0, qtyNum - Number(reserved));
  }, [qtyNum, reserved, row]);

  useEffect(() => {
    if (!open || !variant?._id || !vendorId) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setInventoryId(null);
      setRow(null);
      setQuantity("");
      try {
        const res = await axios.get(API_ENDPOINTS.INVENTORY_LIST, {
          params: { vendorId, limit: 100, page: 1 },
          withCredentials: true,
        });
        if (!res.data?.success) {
          toast.error(res.data?.message ?? "Failed to load stock");
          return;
        }
        const rows = (res.data.inventory ?? []) as InventoryListRow[];
        const found = rows.find((r: InventoryListRow) =>
          rowVariantId({ variant: r.variant }) === String(variant._id)
        );
        if (cancelled) return;
        if (found) {
          setInventoryId(found._id);
          setRow(found);
          setQuantity(typeof found.quantity === "number" ? found.quantity : 0);
        } else {
          setQuantity("");
        }
      } catch {
        if (!cancelled) toast.error("Failed to load stock");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, variant?._id, vendorId]);

  const variantLabel = (() => {
    const pv = row?.variant;
    if (pv && typeof pv === "object") {
      const name = pv.name?.trim();
      const sku = pv.sku?.trim();
      if (name && sku) return `${name} · ${sku}`;
      if (name) return name;
      if (sku) return sku;
    }
    const bits = [productName, variant?.size, variant?.color].filter(Boolean);
    if (bits.length) return `${bits.join(" · ")} · ${variant?.sku ?? ""}`.trim();
    return variant?.sku ?? "—";
  })();

  const vendorLabel = (() => {
    const v = row?.vendor;
    if (v && typeof v === "object" && v.name) return v.name;
    return vendorName;
  })();

  const locationLabel = row?.locationType ?? "vendor";

  const save = async () => {
    if (!variant?._id) return;
    const bodyQty = quantity === "" ? 0 : Number(quantity);
    setSubmitting(true);
    try {
      if (inventoryId) {
        const res = await axios.put(
          API_ENDPOINTS.UPDATE_INVENTORY,
          { inventoryId, quantity: bodyQty },
          { withCredentials: true }
        );
        if (res.data?.success) {
          toast.success("Stock updated");
          onClose();
        } else {
          toast.error(res.data?.message ?? "Update failed");
        }
      } else {
        const res = await axios.post(
          API_ENDPOINTS.CREATE_INVENTORY,
          { variantId: variant._id, vendorId, quantity: bodyQty },
          { withCredentials: true }
        );
        if (res.data?.success) {
          toast.success("Stock saved");
          onClose();
        } else {
          toast.error(res.data?.message ?? "Save failed");
        }
      }
    } catch {
      toast.error("Request failed");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async () => {
    if (!inventoryId) return;
    setSubmitting(true);
    try {
      const res = await axios.delete(API_ENDPOINTS.DELETE_INVENTORY, {
        data: { inventoryId },
        withCredentials: true,
      });
      if (res.data?.success) {
        toast.success("Stock record removed");
        onClose();
      } else {
        toast.error(res.data?.message ?? "Remove failed");
      }
    } catch {
      toast.error("Remove failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !variant) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full border border-gray-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Inventory</h2>

        {loading ? (
          <p className="text-sm text-gray-500 py-4">Loading...</p>
        ) : (
          <>
            <dl className="space-y-3 mb-6 border-b border-gray-200 dark:border-slate-600 pb-4">
              <div>
                <dt className={labelClass()}>Variant</dt>
                <dd className={`${valueClass()} break-words`}>{variantLabel}</dd>
              </div>
              <div>
                <dt className={labelClass()}>Vendor</dt>
                <dd className={valueClass()}>{vendorLabel}</dd>
              </div>
              <div>
                <dt className={labelClass()}>Location type</dt>
                <dd className={valueClass()}>{locationLabel}</dd>
              </div>
              {inventoryId && row ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className={labelClass()}>Reserved</dt>
                    <dd className={valueClass()}>{reserved}</dd>
                  </div>
                  <div>
                    <dt className={labelClass()}>Sellable (available)</dt>
                    <dd className={valueClass()}>{availablePreview}</dd>
                  </div>
                  <div>
                    <dt className={labelClass()}>Missing hold</dt>
                    <dd className={valueClass()}>{row.missingHold ?? 0}</dd>
                  </div>
                  <div>
                    <dt className={labelClass()}>Damaged / quarantine</dt>
                    <dd className={valueClass()}>{row.damagedQty ?? 0}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className={labelClass()}>Extra hold (unconfirmed)</dt>
                    <dd className={valueClass()}>{row.extraHold ?? 0}</dd>
                  </div>
                </div>
              ) : null}
            </dl>

            <label className={`block ${labelClass()} mb-1`}>Quantity (editable)</label>
            <input
              type="number"
              min={0}
              placeholder="0"
              className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white mb-4"
              value={quantity === "" ? "" : quantity}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") {
                  setQuantity("");
                  return;
                }
                const n = Number(v);
                if (!Number.isNaN(n)) setQuantity(n);
              }}
            />
            {inventoryId ? (
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                Editing quantity updates total on-hand. Sellable follows: total − reserved − missing − damaged − extra
                hold (backend recomputes).
              </p>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                No stock record yet — set quantity and save to create one.
              </p>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={save}
                className="w-full py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black font-medium text-sm disabled:opacity-50"
              >
                Save
              </button>
              {inventoryId ? (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={remove}
                  className="w-full py-2 rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm disabled:opacity-50"
                >
                  Delete inventory
                </button>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-sm text-gray-800 dark:text-gray-200"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
