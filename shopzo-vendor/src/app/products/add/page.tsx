"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { API_ENDPOINTS } from "@/app/lib/api";
import axios from "axios";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { uploadProductImagesToS3 } from "@/lib/s3Upload";

type Category = { _id: string; name: string };
type Subcategory = { _id: string; name: string };

const MAX_IMAGES = 10;

export default function AddProductPage() {
  const router = useRouter();
  const vendor = useSelector((state: RootState) => state.auth.vendor);

  const [images, setImages] = useState<File[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    subcategory: "",
    slug: "",
  });

  useEffect(() => {
    axios.get(API_ENDPOINTS.GET_CATEGORIES, { withCredentials: true })
      .then((res) => setCategories(res.data.categories ?? []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!formData.category) {
      setSubcategories([]);
      setFormData((prev) => ({ ...prev, subcategory: "" }));
      return;
    }
    axios.get(`${API_ENDPOINTS.GET_SUBCATEGORIES}?categoryId=${formData.category}`, { withCredentials: true })
      .then((res) => setSubcategories(res.data.subcategories ?? []))
      .catch(() => setSubcategories([]));
    setFormData((prev) => ({ ...prev, subcategory: "" }));
  }, [formData.category]);

  const slugFromName = (name: string) =>
    name.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    let selected = Array.from(e.target.files);
    if (selected.length > MAX_IMAGES) {
      selected = selected.slice(0, MAX_IMAGES);
      toast.error(`Max ${MAX_IMAGES} images`);
    }
    setImages((prev) => [...prev, ...selected]);
  };

  const handleRemoveImage = (index: number) => setImages((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting || !vendor?._id) return;
    setIsSubmitting(true);
    try {
      const imageUrls = await uploadProductImagesToS3(images, vendor._id);
      const res = await axios.post(
        API_ENDPOINTS.CREATE_PRODUCT,
        {
          name: formData.name,
          description: formData.description,
          categoryId: formData.category,
          subcategoryId: formData.subcategory || undefined,
          slug: formData.slug,
          imageUrls,
        },
        { withCredentials: true },
      );
      if (res.data.success) {
        toast.success("Product created");
        router.push("/products");
      } else {
        toast.error(res.data.message || "Failed");
      }
    } catch (err) {
      toast.error("Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!vendor?._id) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Add Product</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Create a new product</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData((prev) => ({ ...prev, name, slug: slugFromName(name) }));
                }}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                placeholder="Product name"
              />
            </div>
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Slug</label>
              <input type="text" id="slug" value={formData.slug} readOnly disabled className="w-full px-4 py-2.5 rounded-lg border bg-gray-100 dark:bg-slate-700 text-sm" />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description *</label>
              <textarea
                id="description"
                name="description"
                rows={4}
                required
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm resize-none"
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category *</label>
              <select id="category" name="category" required value={formData.category} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm">
                <option value="">Select category</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subcategory</label>
              <select id="subcategory" name="subcategory" value={formData.subcategory} onChange={handleChange} disabled={!formData.category} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm">
                <option value="">Select subcategory</option>
                {subcategories.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Images (max {MAX_IMAGES})</label>
              <label className="flex flex-col items-center justify-center w-full min-h-[100px] border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100">
                <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                <span className="text-sm text-gray-600 py-4">Click to upload</span>
              </label>
              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-3 mt-4">
                  {images.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border">
                      <img src={URL.createObjectURL(img)} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => handleRemoveImage(i)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-4">
              <Link href="/products" className="px-6 py-3 rounded-lg font-medium bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300">
                Cancel
              </Link>
              <button type="submit" disabled={isSubmitting} className="flex-1 px-6 py-3 rounded-lg font-medium bg-black dark:bg-white text-white dark:text-black disabled:opacity-50">
                {isSubmitting ? "Saving..." : "Add Product"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
