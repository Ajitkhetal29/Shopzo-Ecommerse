"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { API_ENDPOINTS } from "@/app/lib/api";
import { RootState } from "@/store";
import { toast } from "react-toastify";
import Image from "next/image";

type ProductDetail = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  status?: string;
  images: { url: string; public_id?: string }[];
  category?: { _id: string; name: string; slug: string };
  subcategory?: { _id: string; name: string; slug: string } | null;
  vendor?: { _id: string; name: string };
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vendor = useSelector((state: RootState) => state.auth.vendor);
  const id = params.id as string;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [imageOrder, setImageOrder] = useState<number[]>([]);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  useEffect(() => {
    if (!id || !vendor?._id) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axios.get(`${API_ENDPOINTS.GET_PRODUCT_BY_ID}/${id}`, {
          withCredentials: true,
        });
        if (!res.data?.success || !res.data?.product) {
          setError("Product not found");
          return;
        }
        const p = res.data.product;
        if (String(p.vendor?._id ?? p.vendor) !== String(vendor._id)) {
          setError("You cannot view this product");
          setProduct(null);
          return;
        }
        setProduct(p);
        setImageOrder((p.images?.length ? p.images : []).map((_: unknown, i: number) => i));
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        setError(status === 404 ? "Product not found" : "Failed to load product");
        toast.error(status === 404 ? "Product not found" : "Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, vendor?._id]);

  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setImageModalOpen(false);
        setDeleteConfirmOpen(false);
      }
    };
    if (imageModalOpen || deleteConfirmOpen) {
      document.addEventListener("keydown", onEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = "";
    };
  }, [imageModalOpen, deleteConfirmOpen]);

  const handleDelete = async () => {
    setDeleteConfirmOpen(false);
    try {
      setDeleting(true);
      const res = await axios.delete(`${API_ENDPOINTS.DELETE_PRODUCT}/${id}`, {
        withCredentials: true,
      });
      if (res.data?.success) {
        toast.success("Product deleted");
        router.push("/products");
        return;
      }
      toast.error(res.data?.message ?? "Delete failed");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Failed to delete product");
    } finally {
      setDeleting(false);
    }
  };

  if (!vendor?._id) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <p className="text-gray-600 dark:text-gray-400">Sign in to view products.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/products"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to products
          </Link>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-8 text-center">
            <p className="text-red-600 dark:text-red-400">{error ?? "Product not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  const images = product.images ?? [];
  const mainIdx = imageOrder[0] ?? 0;
  const mainImage = images[mainIdx]?.url;

  const selectThumbnail = (thumbnailSlot: number) => {
    if (thumbnailSlot <= 0 || thumbnailSlot >= imageOrder.length) return;
    setImageOrder((prev) => {
      const next = [...prev];
      [next[0], next[thumbnailSlot]] = [next[thumbnailSlot], next[0]];
      return next;
    });
  };

  const openImageModal = () => {
    if (!mainImage || images.length === 0) return;
    setModalImageIndex(0);
    setImageModalOpen(true);
  };

  const closeImageModal = () => setImageModalOpen(false);
  const modalPrev = () => {
    setModalImageIndex((i) => (i <= 0 ? imageOrder.length - 1 : i - 1));
  };
  const modalNext = () => {
    setModalImageIndex((i) => (i >= imageOrder.length - 1 ? 0 : i + 1));
  };

  const modalImageIdx = imageOrder[modalImageIndex];
  const modalImageUrl = modalImageIdx != null ? images[modalImageIdx]?.url : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/products"
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to products
        </Link>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 md:p-8">
            <div className="space-y-3">
              <button
                type="button"
                onClick={openImageModal}
                className="aspect-square relative w-full bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                {mainImage ? (
                  <Image
                    src={mainImage}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    unoptimized={mainImage.startsWith("http") && mainImage.includes("cloudinary")}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
                    No image
                  </div>
                )}
              </button>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {imageOrder.slice(1).map((idx, slot) => {
                    const img = images[idx];
                    if (!img) return null;
                    return (
                      <button
                        key={img.public_id ?? idx}
                        type="button"
                        onClick={() => selectThumbnail(slot + 1)}
                        className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 border-2 border-transparent hover:border-gray-400 dark:hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-500"
                      >
                        <Image
                          src={img.url}
                          alt={`${product.name} ${slot + 2}`}
                          fill
                          className="object-cover"
                          sizes="64px"
                          unoptimized={img.url.startsWith("http") && img.url.includes("cloudinary")}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">{product.name}</h1>
              {product.slug && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">/{product.slug}</p>
              )}

              <div className="space-y-3 mb-6">
                <div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Category
                  </span>
                  <p className="text-gray-900 dark:text-white">{product.category?.name ?? "—"}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Subcategory
                  </span>
                  <p className="text-gray-900 dark:text-white">{product.subcategory?.name ?? "—"}</p>
                </div>
                {product.status && (
                  <div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Status
                    </span>
                    <p className="text-gray-900 dark:text-white">{product.status}</p>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Description
                </span>
                <p className="mt-1 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {product.description || "No description."}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
                <Link
                  href={`/products/edit/${id}`}
                  className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200"
                >
                  Edit
                </Link>
                <Link
                  href={`/products/variants/${id}`}
                  className="px-4 py-2 bg-amber-200 dark:bg-amber-900/40 text-gray-900 dark:text-amber-100 rounded-lg font-medium hover:bg-amber-300 dark:hover:bg-amber-800/50"
                >
                  Variants
                </Link>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(true)}
                  disabled={deleting}
                  className="px-4 py-2 border border-red-600 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {deleteConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDeleteConfirmOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Delete product confirmation"
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-sm w-full p-6 border border-gray-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete product?</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
              This will permanently delete &quot;{product.name}&quot;. Variants may need separate cleanup on the
              server.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {imageModalOpen && modalImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={closeImageModal}
          role="dialog"
          aria-modal="true"
          aria-label="Image gallery"
        >
          <div
            className="relative flex items-center justify-center w-full h-full max-w-5xl max-h-[90vh] px-14"
            onClick={(e) => e.stopPropagation()}
          >
            {imageOrder.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  modalPrev();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Previous image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            <div className="relative w-full h-full max-h-[85vh] flex items-center justify-center">
              <Image
                src={modalImageUrl}
                alt={`${product.name} ${modalImageIndex + 1}`}
                fill
                className="object-contain"
                sizes="90vw"
                unoptimized={modalImageUrl.startsWith("http") && modalImageUrl.includes("cloudinary")}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {imageOrder.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  modalNext();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Next image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {imageOrder.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
                {modalImageIndex + 1} / {imageOrder.length}
              </div>
            )}

            <button
              type="button"
              onClick={closeImageModal}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center focus:outline-none"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
