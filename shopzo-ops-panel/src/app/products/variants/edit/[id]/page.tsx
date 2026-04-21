"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "@/lib/api";
import { ProductVariant } from "@/store/types/product";
import { toast } from "react-toastify";
import { uploadFilesToS3 } from "@/lib/s3Upload";

const MAX_IMAGES = 5;

function productIdFromVariant(v: ProductVariant): string {
  const raw = v.product ?? v.productId;
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  return raw._id ?? "";
}

const EditVariantPage = () => {
  const params = useParams();
  const router = useRouter();
  const variantId = params.id as string;

  const [variant, setVariant] = useState<ProductVariant | null>(null);
  const [productId, setProductId] = useState("");
  const [productName, setProductName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [existingImages, setExistingImages] = useState<{ url: string; public_id: string }[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [preview, setPreview] = useState<string[]>([]);

  const [form, setForm] = useState({
    size: "",
    color: "",
    price: "",
    sku: "",
  });

  const [baseSku, setBaseSku] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const res = await axios.get(`${API_ENDPOINTS.GET_VARIANT_BY_ID}/${variantId}`, {
          withCredentials: true,
        });

        if (!res.data.success) throw new Error();

        const v = res.data.variant as ProductVariant;

        setVariant(v);
        setExistingImages(
          (v.images || []).map((img) => ({ url: img.url, public_id: img.public_id ?? "" })),
        );

        const parts = (v.sku || "").split("-");
        const base = parts.length > 3 ? parts.slice(0, -3).join("-") : v.sku || "";
        setBaseSku(base);

        const pid = productIdFromVariant(v);
        setProductId(pid);

        if (pid) {
          try {
            const prodRes = await axios.get(`${API_ENDPOINTS.GET_PRODUCT_BY_ID}/${pid}`, {
              withCredentials: true,
            });
            if (prodRes.data?.success && prodRes.data?.product) {
              setProductName(prodRes.data.product.name ?? "");
            }
          } catch {
            /* product label optional */
          }
        }

        setForm({
          size: v.size || "",
          color: v.color || "",
          price: String(v.price ?? ""),
          sku: v.sku || "",
        });
      } catch {
        setError("Failed to fetch variant");
      } finally {
        setLoading(false);
      }
    };

    if (variantId) fetchData();
  }, [variantId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (baseSku && (name === "size" || name === "color")) {
        const size = name === "size" ? value : prev.size;
        const color = name === "color" ? value : prev.color;
        if (size && color) {
          const random = Math.floor(1000 + Math.random() * 9000);
          next.sku = `${baseSku}-${color.toUpperCase()}-${size.toUpperCase()}-${random}`;
        }
      }
      return next;
    });
  };

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);

    const total = existingImages.length + images.length + files.length;

    if (total > MAX_IMAGES) {
      toast.error(`Max ${MAX_IMAGES} images allowed`);
      return;
    }

    const updatedImages = [...images, ...files];
    setImages(updatedImages);

    const previews = updatedImages.map((file) => URL.createObjectURL(file));
    setPreview(previews);
    e.target.value = "";
  };

  const handleRemoveNewImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    const updatedPreview = preview.filter((_, i) => i !== index);

    setImages(updatedImages);
    setPreview(updatedPreview);
  };

  const handleRemoveExistingImage = (index: number) => {
    const updated = existingImages.filter((_, i) => i !== index);
    setExistingImages(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const imageUrls = await uploadFilesToS3(images, "variant", {
        productId,
        sku: form.sku,
      });

      const res = await axios.put(
        `${API_ENDPOINTS.UPDATE_VARIANT}/${variantId}`,
        {
          size: form.size,
          color: form.color,
          price: form.price,
          sku: form.sku,
          existingImages,
          imageUrls,
        },
        { withCredentials: true },
      );

      if (!res.data.success) throw new Error(res.data.message);

      toast.success("Variant updated successfully");
      if (productId) {
        router.push(`/products/variants/${productId}`);
      } else {
        router.back();
      }
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (err instanceof Error ? err.message : null) ||
          "Failed to update variant",
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
  if (error && !variant) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 max-w-xl mx-auto">
        <Link href="/products" className="text-sm text-gray-600 dark:text-gray-400 hover:underline mb-4 inline-block">
          ← Products
        </Link>
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }
  if (!variant) return <p className="p-6">Variant not found</p>;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4 min-h-screen bg-gray-50 dark:bg-slate-900">
      {productId ? (
        <Link
          href={`/products/variants/${productId}`}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          ← Variants{productName ? ` · ${productName}` : ""}
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
        >
          ← Back
        </button>
      )}
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Edit Variant</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700"
      >
        <div>
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">SKU</label>
          <input
            value={form.sku}
            disabled
            className="w-full border border-gray-300 dark:border-slate-600 p-2 rounded bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Size</label>
          <select
            name="size"
            value={form.size}
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
            value={form.color}
            onChange={handleChange}
            className="w-full border border-gray-300 dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Price</label>
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            className="w-full border border-gray-300 dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Existing Images</label>
          <div className="flex flex-wrap gap-2">
            {existingImages.map((img, index) => (
              <div key={index} className="relative w-24">
                <button
                  type="button"
                  onClick={() => handleRemoveExistingImage(index)}
                  className="absolute top-1 right-1 bg-black text-white text-xs px-1 z-10 rounded"
                >
                  ✕
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} className="w-full rounded" alt="" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Add Images</label>

          {existingImages.length + images.length < MAX_IMAGES && (
            <input
              type="file"
              multiple
              onChange={handleImages}
              className="w-full border border-gray-300 dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-800"
            />
          )}

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {existingImages.length + images.length} / {MAX_IMAGES}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {preview.map((src, index) => (
            <div key={index} className="relative w-24">
              <button
                type="button"
                onClick={() => handleRemoveNewImage(index)}
                className="absolute top-1 right-1 bg-black text-white text-xs px-1 rounded z-10"
              >
                ✕
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} className="w-full rounded" alt="" />
            </div>
          ))}
        </div>

        {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200"
        >
          Update Variant
        </button>
      </form>
    </div>
  );
};

export default EditVariantPage;
