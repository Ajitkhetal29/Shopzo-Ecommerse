"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { API_ENDPOINTS } from "@/lib/api";
import { toast } from "react-toastify";
import { uploadFilesToS3 } from "@/lib/s3Upload";

type Category = { _id: string; name: string };
type Subcategory = { _id: string; name: string };
type Vendor = { _id: string; name: string };
type ProductImage = { url: string; public_id?: string };

const MAX_IMAGES = 10;

const EditProductPage = () => {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  /** Indices into existingImages that user removed */
  const [removedExistingIndices, setRemovedExistingIndices] = useState<Set<number>>(new Set());

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    subcategory: "",
    slug: "",
    vendor: "",
  });
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);

  useEffect(() => {
    if (!id) return;
    axios
      .get(`${API_ENDPOINTS.GET_PRODUCT_BY_ID}/${id}`, { withCredentials: true })
      .then((res) => {
        if (!res.data?.success || !res.data?.product) {
          setError("Product not found");
          return;
        }
        const p = res.data.product;
        setFormData({
          name: p.name ?? "",
          description: p.description ?? "",
          category: p.category?._id ?? p.category ?? "",
          subcategory: p.subcategory?._id ?? p.subcategory ?? "",
          slug: p.slug ?? "",
          vendor: p.vendor?._id ?? p.vendor ?? "",
        });
        setExistingImages(p.images ?? []);
        setRemovedExistingIndices(new Set());
      })
      .catch((err) => {
        setError(err.response?.status === 404 ? "Product not found" : "Failed to load product");
        toast.error("Failed to load product");
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    axios
      .get(API_ENDPOINTS.GET_CATEGORIES, { withCredentials: true })
      .then((res) => setCategories(res.data.categories ?? []))
      .catch(() => setCategories([]));
    axios
      .get(API_ENDPOINTS.GET_VENDORS, { withCredentials: true })
      .then((res) => setVendors(res.data.vendors ?? []))
      .catch(() => setVendors([]));
  }, []);

  useEffect(() => {
    if (!formData.category) {
      setSubcategories([]);
      setFormData((prev) => ({ ...prev, subcategory: "" }));
      return;
    }
    axios
      .get(`${API_ENDPOINTS.GET_SUBCATEGORIES}?categoryId=${formData.category}`, { withCredentials: true })
      .then((res) => {
        const subs = res.data.subcategories ?? [];
        setSubcategories(subs);
        setFormData((prev) => {
          const keepSub = subs.some((s: Subcategory) => s._id === prev.subcategory);
          return { ...prev, subcategory: keepSub ? prev.subcategory : "" };
        });
      })
      .catch(() => setSubcategories([]));
  }, [formData.category]);

  const slugFromName = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({ ...prev, name, slug: slugFromName(name) }));
  };

  const keptExistingCount = existingImages.length - removedExistingIndices.size;
  const totalImageCount = keptExistingCount + newImages.length;

  const handleNewImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    let selected = Array.from(e.target.files);
    const allowed = Math.max(0, MAX_IMAGES - keptExistingCount);
    if (selected.length > allowed) {
      selected = selected.slice(0, allowed);
      toast.error(`Max ${MAX_IMAGES} images total. You can add ${allowed} more.`);
    }
    setNewImages((prev) => [...prev, ...selected].slice(0, MAX_IMAGES - keptExistingCount));
    e.target.value = "";
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setRemovedExistingIndices((prev) => new Set(prev).add(index));
  };

  const restoreExistingImage = (index: number) => {
    setRemovedExistingIndices((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const keepIndices = existingImages
        .map((_, i) => i)
        .filter((i) => !removedExistingIndices.has(i));
      const imageUrls = await uploadFilesToS3(newImages, "product", { productId: id });

      const response = await axios.put(
        `${API_ENDPOINTS.UPDATE_PRODUCT}/${id}`,
        {
          name: formData.name,
          description: formData.description,
          categoryId: formData.category,
          subcategoryId: formData.subcategory || undefined,
          slug: formData.slug,
          vendorId: formData.vendor,
          keepImageIndices: JSON.stringify(keepIndices),
          imageUrls,
        },
        { withCredentials: true },
      );

      if (response.data.success) {
        toast.success("Product updated successfully", { autoClose: 3000 });
        router.push(`/products/${id}`);
      } else {
        toast.error(response.data.message || "Failed to update product");
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Failed to update product");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/products"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            ← Back to products
          </Link>
          <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-8 text-center">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link
            href={`/products/${id}`}
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to product
          </Link>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Edit Product</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Update name, description, category, and images
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Product Details</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-4 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors text-sm"
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                readOnly
                className="w-full px-4 py-2.5 text-gray-900 dark:text-white bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors text-sm resize-none"
                placeholder="Product description"
              />
            </div>

            <div>
              <label htmlFor="vendor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Vendor <span className="text-red-500">*</span>
              </label>
              <select
                id="vendor"
                name="vendor"
                required
                value={formData.vendor}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors text-sm"
              >
                <option value="">Select vendor</option>
                {vendors.map((v) => (
                  <option key={v._id} value={v._id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors text-sm"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subcategory
              </label>
              <select
                id="subcategory"
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors text-sm"
                disabled={!formData.category}
              >
                <option value="">Select subcategory</option>
                {subcategories.map((sub) => (
                  <option key={sub._id} value={sub._id}>{sub.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Images {totalImageCount > 0 && <span className="text-gray-500 font-normal">({totalImageCount} / {MAX_IMAGES})</span>}
              </label>
              {existingImages.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Stored images (remove or add more below)</p>
                  <div className="flex flex-wrap gap-3">
                    {existingImages.map((img, i) => {
                      const removed = removedExistingIndices.has(i);
                      return (
                        <div
                          key={img.public_id ?? i}
                          className={`group relative w-20 h-20 rounded-lg overflow-hidden border-2 bg-gray-100 dark:bg-slate-700 ${
                            removed
                              ? "border-red-300 dark:border-red-700 opacity-60"
                              : "border-gray-200 dark:border-slate-600"
                          }`}
                        >
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                          {removed ? (
                            <button
                              type="button"
                              onClick={() => restoreExistingImage(i)}
                              className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-xs font-medium"
                            >
                              Undo
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => removeExistingImage(i)}
                              className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm"
                              title="Remove image"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <label
                className={`flex flex-col items-center justify-center w-full min-h-[100px] border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700/50 transition-colors ${
                  totalImageCount >= MAX_IMAGES
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700"
                }`}
              >
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleNewImagesChange}
                  className="hidden"
                  disabled={totalImageCount >= MAX_IMAGES}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 py-3">
                  {totalImageCount >= MAX_IMAGES
                    ? `Maximum ${MAX_IMAGES} images reached`
                    : "Click to add more images"}
                </span>
              </label>
              {newImages.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">New uploads</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {newImages.map((img, index) => (
                      <div
                        key={`${img.name}-${index}`}
                        className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600 bg-gray-100 dark:bg-slate-700"
                      >
                        <img src={URL.createObjectURL(img)} alt={img.name} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Link
                href={`/products/${id}`}
                className="px-6 py-3 rounded-lg font-medium text-sm bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 px-6 py-3 rounded-lg font-medium text-sm ${
                  isSubmitting
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:ring-offset-2"
                }`}
              >
                {isSubmitting ? "Saving..." : "Update Product"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProductPage;
