"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { API_ENDPOINTS } from "@/app/lib/api";
import { RootState } from "@/store";
import { ProductVariant } from "@/store/types/product";
import { toast } from "react-toastify";
import ManageInventory from "../compoenents/manageInventory";

export default function ProductVariantsPage() {
  const params = useParams();
  const router = useRouter();
  const vendor = useSelector((state: RootState) => state.auth.vendor);
  const productId = params.id as string;

  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [productName, setProductName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [variantToDelete, setVariantToDelete] = useState<string | null>(null);
  const [stockVariant, setStockVariant] = useState<ProductVariant | null>(null);

  const load = useCallback(async () => {
    if (!productId || !vendor?._id) return;
    setLoading(true);
    setError("");
    try {
      const prodRes = await axios.get(`${API_ENDPOINTS.GET_PRODUCT_BY_ID}/${productId}`, {
        withCredentials: true,
      });
      if (!prodRes.data?.success || !prodRes.data?.product) {
        setError("Product not found");
        setVariants([]);
        return;
      }
      const p = prodRes.data.product;
      if (String(p.vendor?._id ?? p.vendor) !== String(vendor._id)) {
        setError("You cannot manage variants for this product");
        setVariants([]);
        return;
      }
      setProductName(p.name ?? "");

      const vRes = await axios.get(`${API_ENDPOINTS.GET_PRODUCT_VARIANTS}/${productId}`, {
        withCredentials: true,
      });
      if (vRes.data?.success) {
        setVariants(vRes.data.variants ?? []);
      } else {
        setError(vRes.data?.message ?? "Failed to load variants");
      }
    } catch {
      setError("Failed to load variants");
      toast.error("Failed to load variants");
    } finally {
      setLoading(false);
    }
  }, [productId, vendor?._id]);

  useEffect(() => {
    load();
  }, [load]);

  const deleteVariant = async (variantId: string) => {
    try {
      const res = await axios.delete(`${API_ENDPOINTS.DELETE_VARIANT}/${variantId}`, {
        withCredentials: true,
      });
      if (res.data?.success) {
        toast.success("Variant deleted");
        load();
      } else {
        toast.error(res.data?.message ?? "Delete failed");
      }
    } catch {
      toast.error("Failed to delete variant");
    }
  };

  if (!vendor?._id) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <p className="text-gray-600 dark:text-gray-400">Sign in to manage variants.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/products" className="text-sm text-gray-600 dark:text-gray-400 hover:underline mb-4 inline-block">
            ← Back to products
          </Link>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <Link
              href={`/products/${productId}`}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2 inline-flex items-center gap-1"
            >
              ← {productName || "Product"}
            </Link>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Variants</h1>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/products/variants/add/${productId}`)}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium text-sm"
          >
            Add variant
          </button>
        </div>

        {variants.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No variants yet.</p>
            <button
              type="button"
              onClick={() => router.push(`/products/variants/add/${productId}`)}
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium text-sm"
            >
              Add variant
            </button>
          </div>
        ) : (
          <ul className="space-y-4">
            {variants.map((v) => (
              <li
                key={v._id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 flex flex-col sm:flex-row sm:items-start gap-4"
              >
                <div className="flex gap-2 flex-wrap">
                  {(v.images ?? []).map((img, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={`${v._id}-${i}`}
                      src={img.url}
                      alt=""
                      className="w-20 h-20 object-cover rounded-lg bg-gray-100 dark:bg-slate-700"
                    />
                  ))}
                </div>
                <div className="flex-1 min-w-0 space-y-1 text-sm">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {v.size} · {v.color} · ${v.price}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 font-mono text-xs break-all">SKU: {v.sku}</p>
                </div>
                <div className="flex flex-wrap gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setStockVariant(v)}
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg"
                  >
                    Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(`/products/variants/edit/${v._id}`)}
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVariantToDelete(v._id);
                      setDeleteOpen(true);
                    }}
                    className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ManageInventory
        variant={stockVariant}
        vendorId={vendor._id}
        vendorName={vendor.name}
        productName={productName}
        open={!!stockVariant}
        onClose={() => setStockVariant(null)}
      />

      {deleteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            setDeleteOpen(false);
            setVariantToDelete(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full border border-gray-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete variant?</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">This cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600"
                onClick={() => {
                  setDeleteOpen(false);
                  setVariantToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-3 py-2 text-sm rounded-lg bg-red-600 text-white"
                onClick={() => {
                  if (variantToDelete) deleteVariant(variantToDelete);
                  setDeleteOpen(false);
                  setVariantToDelete(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
