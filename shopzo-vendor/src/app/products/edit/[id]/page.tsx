"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { API_ENDPOINTS } from "@/app/lib/api";
import axios from "axios";
import { toast } from "react-toastify";

type Category = { _id: string; name: string };
type Subcategory = { _id: string; name: string };
type ProductImage = { url: string; public_id?: string };

const MAX_IMAGES = 10;

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const vendor = useSelector((state: RootState) => state.auth.vendor);
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [removedExistingIndices, setRemovedExistingIndices] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState({ name: "", description: "", category: "", subcategory: "", slug: "" });
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);

  useEffect(() => {
    if (!id || !vendor?._id) return;
    axios.get(`${API_ENDPOINTS.GET_PRODUCT_BY_ID}/${id}`, { withCredentials: true })
      .then((res) => {
        if (!res.data?.success || !res.data?.product) {
          setError("Product not found");
          return;
        }
        const p = res.data.product;
        if (String(p.vendor?._id ?? p.vendor) !== String(vendor._id)) {
          setError("You cannot edit this product");
          return;
        }
        setFormData({
          name: p.name ?? "",
          description: p.description ?? "",
          category: p.category?._id ?? p.category ?? "",
          subcategory: p.subcategory?._id ?? p.subcategory ?? "",
          slug: p.slug ?? "",
        });
        setExistingImages(p.images ?? []);
      })
      .catch(() => {
        setError("Failed to load product");
        toast.error("Failed to load product");
      })
      .finally(() => setLoading(false));
  }, [id, vendor?._id]);

  useEffect(() => {
    axios.get(API_ENDPOINTS.GET_CATEGORIES, { withCredentials: true })
      .then((res) => setCategories(res.data.categories ?? []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!formData.category) {
      setSubcategories([]);
      setFormData((prev) => ({ ...prev, subcategory: "" }));
      return;
    }
    axios.get(`${API_ENDPOINTS.GET_SUBCATEGORIES}?categoryId=${formData.category}`, { withCredentials: true })
      .then((res) => {
        const subs = res.data.subcategories ?? [];
        setSubcategories(subs);
        setFormData((prev) => ({
          ...prev,
          subcategory: subs.some((s: Subcategory) => s._id === prev.subcategory) ? prev.subcategory : "",
        }));
      })
      .catch(() => setSubcategories([]));
  }, [formData.category]);

  const slugFromName = (name: string) =>
    name.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const keptExistingCount = existingImages.length - removedExistingIndices.size;
  const totalImageCount = keptExistingCount + newImages.length;

  const handleNewImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    let selected = Array.from(e.target.files);
    const allowed = Math.max(0, MAX_IMAGES - keptExistingCount);
    if (selected.length > allowed) {
      selected = selected.slice(0, allowed);
      toast.error(`Max ${MAX_IMAGES} images. You can add ${allowed} more.`);
    }
    setNewImages((prev) => [...prev, ...selected].slice(0, allowed));
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting || !vendor?._id) return;
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", formData.name);
      fd.append("description", formData.description);
      fd.append("categoryId", formData.category);
      if (formData.subcategory) fd.append("subcategoryId", formData.subcategory);
      fd.append("slug", formData.slug);
      const keepIndices = existingImages.map((_, i) => i).filter((i) => !removedExistingIndices.has(i));
      fd.append("keepImageIndices", JSON.stringify(keepIndices));
      newImages.forEach((img) => fd.append("images", img));

      const res = await axios.put(`${API_ENDPOINTS.UPDATE_PRODUCT}/${id}`, fd, { withCredentials: true });
      if (res.data.success) {
        toast.success("Product updated");
        router.push("/products");
      } else {
        toast.error(res.data.message || "Failed");
      }
    } catch (err) {
      toast.error("Failed to update product");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/products" className="text-sm text-gray-600 hover:text-gray-900">← Back to products</Link>
          <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl border p-8 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/products" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 inline-block">← Back to products</Link>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Edit Product</h1>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value, slug: slugFromName(e.target.value) }))}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Slug</label>
              <input type="text" value={formData.slug} readOnly className="w-full px-4 py-2.5 rounded-lg border bg-gray-100 dark:bg-slate-700 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
              <textarea name="description" rows={4} value={formData.description} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category *</label>
              <select name="category" required value={formData.category} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm">
                <option value="">Select category</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subcategory</label>
              <select name="subcategory" value={formData.subcategory} onChange={handleChange} disabled={!formData.category} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm">
                <option value="">Select subcategory</option>
                {subcategories.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Images ({totalImageCount}/{MAX_IMAGES})</label>
              {existingImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {existingImages.map((img, i) => {
                    const removed = removedExistingIndices.has(i);
                    return (
                      <div key={i} className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 ${removed ? "opacity-50 border-red-400" : ""}`}>
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() =>
                          setRemovedExistingIndices((prev) => {
                            const next = new Set(prev);
                            if (removed) next.delete(i);
                            else next.add(i);
                            return next;
                          })
                        }
                          className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-xs"
                        >
                          {removed ? "Undo" : "Remove"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <label className={`flex flex-col items-center justify-center w-full min-h-[80px] border-2 border-dashed rounded-lg ${totalImageCount >= MAX_IMAGES ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
                <input type="file" multiple accept="image/*" onChange={handleNewImagesChange} className="hidden" disabled={totalImageCount >= MAX_IMAGES} />
                <span className="text-sm text-gray-600 py-3">{totalImageCount >= MAX_IMAGES ? "Max reached" : "Add more images"}</span>
              </label>
              {newImages.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {newImages.map((img, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                      <img src={URL.createObjectURL(img)} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setNewImages((prev) => prev.filter((_, j) => j !== i))} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-4">
              <Link href="/products" className="px-6 py-3 rounded-lg font-medium bg-gray-200 dark:bg-slate-700">Cancel</Link>
              <button type="submit" disabled={isSubmitting} className="flex-1 px-6 py-3 rounded-lg font-medium bg-black dark:bg-white text-white dark:text-black disabled:opacity-50">
                {isSubmitting ? "Saving..." : "Update Product"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
