"use client";

import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "@/lib/api";
import { Product } from "@/store/types/product";
import { toast } from "react-toastify";

const MAX_IMAGES = 5;

const AddVariantPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [images, setImages] = useState<File[]>([]);
  const [preview, setPreview] = useState<string[]>([]);

  const [variant, setVariant] = useState({
    size: "",
    color: "",
    price: "",
    sku: "",
  });

  const [skuSeed] = useState(() => Math.floor(1000 + Math.random() * 9000));

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_ENDPOINTS.GET_PRODUCT_BY_ID}/${id}`, {
          withCredentials: true,
        });

        if (!res.data.success) throw new Error();
        setProduct(res.data.product);
      } catch {
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!product) return;

    const base = product.name.replace(/\s+/g, "-").toUpperCase();
    const color = variant.color || "X";
    const size = variant.size || "X";

    setVariant((prev) => ({
      ...prev,
      sku: `${base}-${color.toUpperCase()}-${size.toUpperCase()}-${skuSeed}`,
    }));
  }, [variant.color, variant.size, product, skuSeed]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setVariant({ ...variant, [e.target.name]: e.target.value });
  };

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);

    const total = [...images, ...files].slice(0, MAX_IMAGES);

    setImages(total);

    const previews = total.map((file) => URL.createObjectURL(file));
    setPreview(previews);
    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = preview.filter((_, i) => i !== index);

    setImages(newImages);
    setPreview(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const formData = new FormData();
      formData.append("productId", id);
      formData.append("size", variant.size);
      formData.append("color", variant.color);
      formData.append("price", variant.price);
      formData.append("sku", variant.sku);
      images.forEach((file) => formData.append("images", file));

      const res = await axios.post(API_ENDPOINTS.CREATE_VARIANT, formData, {
        withCredentials: true,
      });

      if (!res.data.success) throw new Error(res.data.message || "Failed to create variant");

      toast.success("Variant created successfully", { autoClose: 3000 });
      router.push(`/products/${id}`);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "An error occurred",
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }
  if (error && !product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 max-w-xl mx-auto">
        <Link href="/products" className="text-sm text-gray-600 dark:text-gray-400 hover:underline mb-4 inline-block">
          ← Products
        </Link>
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }
  if (!product) return <p className="p-6">Product not found</p>;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4 min-h-screen bg-gray-50 dark:bg-slate-900">
      <Link
        href={`/products/${id}`}
        className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        ← {product.name}
      </Link>
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Add variant · {product.name}</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700"
      >
        <div>
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">SKU</label>
          <input
            value={variant.sku}
            disabled
            className="w-full border border-gray-300 dark:border-slate-600 p-2 rounded bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Size</label>
          <select
            name="size"
            value={variant.size}
            onChange={handleChange}
            className="w-full border border-gray-300 dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
          >
            <option value="">Select</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Color</label>
          <input
            name="color"
            value={variant.color}
            onChange={handleChange}
            className="w-full border border-gray-300 dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
            placeholder="e.g. Red"
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Price</label>
          <input
            type="number"
            name="price"
            value={variant.price}
            onChange={handleChange}
            className="w-full border border-gray-300 dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Images</label>

          {images.length < MAX_IMAGES && (
            <input
              type="file"
              multiple
              onChange={handleImages}
              className="w-full border border-gray-300 dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-800"
            />
          )}

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {images.length === 0
              ? "Upload up to 5 images"
              : `${images.length} / ${MAX_IMAGES} images selected`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {preview.map((src, index) => (
            <div key={index} className="w-24 relative">
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-1 right-1 bg-black text-white text-xs px-1 z-10 rounded"
              >
                ✕
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="Preview" className="w-full h-auto rounded" />
            </div>
          ))}
        </div>

        {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg font-medium disabled:opacity-50 hover:bg-gray-800 dark:hover:bg-gray-200"
          disabled={!variant.size || !variant.color || !variant.price}
        >
          Create Variant
        </button>
      </form>
    </div>
  );
};

export default AddVariantPage;
