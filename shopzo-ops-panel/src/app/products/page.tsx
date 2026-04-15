"use client";

import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { setProducts } from "@/store/slices/productSlice";
import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "@/lib/api";
import axios from "axios";
import { toast } from "react-toastify";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Product } from "@/store/types/product";

const LIMIT = 20;

type CategoryOption = { _id: string; name: string };
type SubcategoryOption = { _id: string; name: string };

const ProductPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const vendors = useSelector((state: RootState) => state.vendor.vendors);
  const products = useSelector((state: RootState) => state.product.products);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(API_ENDPOINTS.GET_PRODUCTS, {
        withCredentials: true,
        params: {
          page: pagination.page,
          limit: pagination.limit,
          categoryId: categoryId || undefined,
          subcategoryId: subcategoryId || undefined,
          vendorId: vendorId || undefined,
        }
      });
      if (response.data.success) {
        dispatch(setProducts(response.data.products));
        setTotalCount(response.data.totalCount ?? 0);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to fetch products. Please try again.");
      toast.error("Failed to fetch products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    axios
      .get(API_ENDPOINTS.GET_CATEGORIES, { withCredentials: true })
      .then((res) => setCategories(res.data.categories ?? []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const url = categoryId
      ? `${API_ENDPOINTS.GET_SUBCATEGORIES}?categoryId=${categoryId}`
      : API_ENDPOINTS.GET_SUBCATEGORIES;
    axios
      .get(url, { withCredentials: true })
      .then((res) => setSubcategories(res.data.subcategories ?? []))
      .catch(() => setSubcategories([]));
  }, [categoryId]);

  useEffect(() => {
    if (!categoryId) setSubcategoryId("");
  }, [categoryId]);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, categoryId, subcategoryId, vendorId]);

  const totalPages = Math.ceil(totalCount / pagination.limit) || 1;
  const hasPrev = pagination.page > 1;
  const hasNext = pagination.page < totalPages;



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
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Products</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manage products — click a product to view details
            </p>
          </div>
          <Link
            href="/products/add"
            className="inline-flex items-center justify-center px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3 justify-end">
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={subcategoryId}
            onChange={(e) => {
              setSubcategoryId(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
            disabled={!categoryId}
          >
            <option value="">All subcategories</option>
            {subcategories.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={vendorId}
            onChange={(e) => {
              setVendorId(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
          >
            <option value="">All vendors</option>
            {vendors.map((v) => (
              <option key={v._id} value={v._id}>
                {v.name}
              </option>
            ))}
          </select>
          {(categoryId || subcategoryId || vendorId) && (
            <button
              type="button"
              onClick={() => {
                setCategoryId("");
                setSubcategoryId("");
                setVendorId("");
                setPagination({ ...pagination, page: 1 });
              }}
              className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Product grid - ecommerce card style */}
        {products.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8 4-8-4m0 0l8-4 8 4m0 0l-8 4m8-4v12M4 7v12"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No products</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {categoryId || subcategoryId || vendorId ? "Try changing filters." : "Get started by creating a product."}
            </p>
            {!categoryId && !subcategoryId && !vendorId && (
              <div className="mt-6">
                <Link
                  href="/products/add"
                  className="inline-flex items-center px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                  Add Product
                </Link>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map((product) => (
                <button
                  key={product._id}
                  type="button"
                  onClick={() => router.push(`/products/${product._id}`)}
                  className="group text-left bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-slate-600 transition-all"
                >
                  <div className="aspect-square bg-gray-100 dark:bg-slate-700 relative overflow-hidden">
                    {product.images?.[0]?.url ? (
                      <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">No image</div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-black dark:group-hover:text-white">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {product.category.name}
                      {product.subcategory ? ` · ${product.subcategory.name}` : ""} · {product.vendor.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
                <button
                  type="button"
                  disabled={!hasPrev || loading}
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                  Page {pagination.page} of {totalPages}
                  {totalCount > 0 && (
                    <span className="ml-1">
                      ({totalCount} {totalCount === 1 ? "product" : "products"})
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  disabled={!hasNext || loading}
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700"
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
};

export default ProductPage;
