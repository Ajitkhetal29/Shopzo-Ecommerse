"use client";

import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { API_ENDPOINTS } from "@/app/lib/api";
import { RootState } from "@/store";
import { Product } from "@/store/types/product";
import { toast } from "react-toastify";
import { uploadFilesToS3 } from "@/lib/s3Upload";

const MAX_IMAGES = 5;

export default function AddVariantPage() {
  const router = useRouter();
  const params = useParams();
  const vendor = useSelector((state: RootState) => state.auth.vendor);
  const id = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
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
    if (!id || !vendor?._id) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_ENDPOINTS.GET_PRODUCT_BY_ID}/${id}`, { withCredentials: true });
        if (!res.data.success || !res.data.product) {
          setError("Product not found");
          return;
        }
        const p = res.data.product;
        if (String(p.vendor?._id ?? p.vendor) !== String(vendor._id)) {
          setError("You cannot add variants to this product");
          return;
        }
        setProduct(p);
      } catch {
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, vendor?._id]);

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
    setPreview(total.map((file) => URL.createObjectURL(file)));
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setPreview(preview.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const imageUrls = await uploadFilesToS3(images, "variant", {
        productId: id,
        sku: variant.sku,
      });

      const res = await axios.post(
        API_ENDPOINTS.CREATE_VARIANT,
        {
          productId: id,
          size: variant.size,
          color: variant.color,
          price: variant.price,
          sku: variant.sku,
          imageUrls,
        },
        { withCredentials: true },
      );
      if (!res.data.success) throw new Error(res.data.message || "Failed to create variant");
      toast.success("Variant created");
      router.push(`/products/${id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || (err instanceof Error ? err.message : "An error occurred"));
    }
  };

  if (!vendor?._id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-gray-600">Sign in to continue.</p>
      </div>
    );
  }

  if (loading) return <p className="p-6">Loading...</p>;
  if (error && !product) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <Link href="/products" className="text-sm text-gray-600 hover:underline mb-4 inline-block">
          ← Products
        </Link>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }
  if (!product) return <p className="p-6">Product not found</p>;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4 min-h-screen bg-gray-50 dark:bg-slate-900">
      <Link href={`/products/${id}`} className="text-sm text-gray-600 dark:text-gray-400 hover:underline">
        ← {product.name}
      </Link>
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Add variant · {product.name}</h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
        <div>
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">SKU</label>
          <input value={variant.sku} disabled className="w-full border dark:border-slate-600 p-2 rounded bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Size</label>
          <select
            name="size"
            value={variant.size}
            onChange={handleChange}
            className="w-full border dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
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
            className="w-full border dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
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
            className="w-full border dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Images</label>
          {images.length < MAX_IMAGES && (
            <input type="file" multiple onChange={handleImages} className="w-full border dark:border-slate-600 p-2 rounded" />
          )}
          <p className="text-sm text-gray-500 mt-1">
            {images.length} / {MAX_IMAGES} images
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
              <img src={src} alt="" className="w-full h-auto rounded" />
            </div>
          ))}
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg disabled:opacity-50"
          disabled={!variant.size || !variant.color || !variant.price}
        >
          Create variant
        </button>
      </form>
    </div>
  );
}
