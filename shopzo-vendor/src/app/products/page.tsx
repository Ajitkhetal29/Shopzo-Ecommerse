"use client";

import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { setProducts } from "@/store/slices/productSlice";
import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "@/app/lib/api";
import axios from "axios";
import { toast } from "react-toastify";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Product } from "@/store/types/product";

const LIMIT = 20;

type CategoryOption = { _id: string; name: string };
type SubcategoryOption = { _id: string; name: string };

export default function ProductsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const vendor = useSelector((state: RootState) => state.auth.vendor);
  const products = useSelector((state: RootState) => state.product.products);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, limit: LIMIT });

  const fetchProducts = async () => {
    if (!vendor?._id) return;
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(API_ENDPOINTS.GET_PRODUCTS, {
        withCredentials: true,
        params: {
          page: pagination.page,
          limit: pagination.limit,
          categoryId: categoryId || undefined,
          subcategoryId: subcategoryId || undefined,
        },
      });
      if (res.data.success) {
        dispatch(setProducts(res.data.products ?? []));
        setTotalCount(res.data.totalCount ?? 0);
      }
    } catch (err) {
      setError("Failed to fetch products.");
      toast.error("Failed to fetch products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    axios.get(API_ENDPOINTS.GET_CATEGORIES, { withCredentials: true })
      .then((res) => setCategories(res.data.categories ?? []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!categoryId) {
      setSubcategories([]);
      setSubcategoryId("");
      return;
    }
    axios
      .get(`${API_ENDPOINTS.GET_SUBCATEGORIES}?categoryId=${categoryId}`, { withCredentials: true })
      .then((res) => setSubcategories(res.data.subcategories ?? []))
      .catch(() => setSubcategories([]));
    setSubcategoryId("");
  }, [categoryId]);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendor?._id, pagination.page, pagination.limit, categoryId, subcategoryId]);

  const totalPages = Math.ceil(totalCount / pagination.limit) || 1;

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-slate-900 min-h-screen">
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Products</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage your products</p>
          </div>
          <Link
            href="/products/add"
            className="inline-flex items-center justify-center px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </Link>
        </div>

        <div className="mb-6 flex flex-wrap gap-3 justify-end">
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <select
            value={subcategoryId}
            onChange={(e) => {
              setSubcategoryId(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm"
            disabled={!categoryId}
          >
            <option value="">All subcategories</option>
            {subcategories.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>

        {products.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-12 text-center">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">No products</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding a product.</p>
            <Link href="/products/add" className="mt-6 inline-flex px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium">
              Add Product
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map((p: Product) => (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => router.push(`/products/${p._id}`)}
                  className="group text-left bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all"
                >
                  <div className="aspect-square bg-gray-100 dark:bg-slate-700 relative overflow-hidden">
                    {p.images?.[0]?.url ? (
                      <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image</div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">{p.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {p.category?.name}
                      {p.subcategory ? ` · ${p.subcategory.name}` : ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1 || loading}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  className="px-4 py-2 rounded-lg border disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm">Page {pagination.page} of {totalPages}</span>
                <button
                  type="button"
                  disabled={pagination.page >= totalPages || loading}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  className="px-4 py-2 rounded-lg border disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}