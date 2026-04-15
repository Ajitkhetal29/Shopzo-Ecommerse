"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "@/lib/api";
import { toast } from "react-toastify";

type Category = { _id: string; name: string; slug: string };

type Subcategory = {
  _id: string;
  name: string;
  slug: string;
  category: Category;
};

type GroupedByCategory = { category: Category; subcategories: Subcategory[] }[];

const Subcategories = () => {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterCategoryId, setFilterCategoryId] = useState<string>("");
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({ name: "", slug: "", categoryId: "" });
  const [editFormData, setEditFormData] = useState({ name: "", slug: "", categoryId: "" });

  const groupedByCategory = useMemo((): GroupedByCategory => {
    const catById = new Map(categories.map((c) => [c._id, c]));
    const map = new Map<string, { category: Category; subcategories: Subcategory[] }>();
    for (const sub of subcategories) {
      const cat = typeof sub.category === "object" ? sub.category : null;
      const catId = cat?._id ?? (sub as any).category;
      if (!catId) continue;
      if (!map.has(catId)) {
        const resolved = cat ?? catById.get(catId) ?? { _id: catId, name: "Unknown", slug: "" };
        map.set(catId, { category: resolved, subcategories: [] });
      }
      map.get(catId)!.subcategories.push(sub);
    }
    const order = categories.map((c) => c._id);
    const result: GroupedByCategory = [];
    for (const catId of order) {
      const entry = map.get(catId);
      if (entry) result.push(entry);
    }
    for (const [catId, entry] of map) {
      if (!order.includes(catId)) result.push(entry);
    }
    return result;
  }, [subcategories, categories]);

  const toggleCategory = (catId: string) => {
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.GET_CATEGORIES, { withCredentials: true });
      if (res.data.success) setCategories(res.data.categories);
    } catch (e) {
      console.error("Error fetching categories:", e);
    }
  };

  const fetchSubcategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = filterCategoryId
        ? `${API_ENDPOINTS.GET_SUBCATEGORIES}?categoryId=${filterCategoryId}`
        : API_ENDPOINTS.GET_SUBCATEGORIES;
      const res = await axios.get(url, { withCredentials: true });
      if (res.data.success) setSubcategories(res.data.subcategories);
      else setError(res.data.message || "Failed to fetch subcategories");
    } catch (e) {
      console.error("Error fetching subcategories:", e);
      setError("Failed to fetch subcategories.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchSubcategories();
  }, [filterCategoryId]);

  useEffect(() => {
    if (filterCategoryId && groupedByCategory.length === 1) {
      setExpandedCategoryIds(new Set([filterCategoryId]));
    }
  }, [filterCategoryId, groupedByCategory.length]);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!addFormData.categoryId) {
      toast.error("Please select a category", { autoClose: 3000 });
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        API_ENDPOINTS.CREATE_SUBCATEGORY,
        { name: addFormData.name, slug: addFormData.slug, categoryId: addFormData.categoryId },
        { withCredentials: true }
      );
      if (res.data.success) {
        setAddFormData({ name: "", slug: "", categoryId: "" });
        setAddModalOpen(false);
        fetchSubcategories();
        toast.success("Subcategory added successfully", { autoClose: 3000 });
      } else {
        setError(res.data.message || "Failed to add subcategory");
        toast.error(res.data.message || "Failed to add subcategory", { autoClose: 3000 });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add subcategory.");
      toast.error(err.response?.data?.message || "Failed to add subcategory", { autoClose: 3000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSubcategoryId) return;
    if (!editFormData.categoryId) {
      toast.error("Please select a category", { autoClose: 3000 });
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.put(
        `${API_ENDPOINTS.UPDATE_SUBCATEGORY}/${selectedSubcategoryId}`,
        { name: editFormData.name, slug: editFormData.slug, categoryId: editFormData.categoryId },
        { withCredentials: true }
      );
      if (res.data.success) {
        setEditFormData({ name: "", slug: "", categoryId: "" });
        setEditModalOpen(false);
        setSelectedSubcategoryId(null);
        fetchSubcategories();
        toast.success("Subcategory updated successfully", { autoClose: 3000 });
      } else {
        toast.error(res.data.message || "Failed to update subcategory", { autoClose: 3000 });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update subcategory", { autoClose: 3000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSubcategoryId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.delete(`${API_ENDPOINTS.DELETE_SUBCATEGORY}/${selectedSubcategoryId}`, {
        withCredentials: true,
      });
      if (res.data.success) {
        setDeleteModalOpen(false);
        setSelectedSubcategoryId(null);
        fetchSubcategories();
        toast.success("Subcategory deleted successfully", { autoClose: 3000 });
      } else {
        toast.error(res.data.message || "Failed to delete subcategory", { autoClose: 3000 });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete subcategory", { autoClose: 3000 });
    } finally {
      setIsLoading(false);
    }
  };

  const openEdit = (sub: Subcategory) => {
    setSelectedSubcategoryId(sub._id);
    setEditFormData({
      name: sub.name,
      slug: sub.slug,
      categoryId: typeof sub.category === "object" ? sub.category._id : (sub as any).category,
    });
    setEditModalOpen(true);
  };

  const handleAddFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const updated = { ...addFormData, [name]: value };
    if (name === "name") updated.slug = generateSlug(value);
    setAddFormData(updated);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const updated = { ...editFormData, [name]: value };
    if (name === "name") updated.slug = generateSlug(value);
    setEditFormData(updated);
  };

  return (
    <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 border border-gray-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Subcategories</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={filterCategoryId}
            onChange={(e) => setFilterCategoryId(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setAddModalOpen(true)}
            className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            Add Subcategory
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Add Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add Subcategory</h2>
            <form onSubmit={handleAdd}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="categoryId"
                  value={addFormData.categoryId}
                  onChange={handleAddFormChange}
                  required
                  className="w-full px-4 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subcategory Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={addFormData.name}
                  onChange={handleAddFormChange}
                  type="text"
                  name="name"
                  className="w-full px-4 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm"
                  placeholder="e.g. Phones"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  value={addFormData.slug}
                  onChange={handleAddFormChange}
                  type="text"
                  name="slug"
                  className="w-full px-4 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm"
                  placeholder="phones"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAddModalOpen(false);
                    setAddFormData({ name: "", slug: "", categoryId: "" });
                  }}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50"
                >
                  Add Subcategory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Edit Subcategory</h2>
            <form onSubmit={handleEdit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="categoryId"
                  value={editFormData.categoryId}
                  onChange={handleEditFormChange}
                  required
                  className="w-full px-4 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subcategory Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={editFormData.name}
                  onChange={handleEditFormChange}
                  type="text"
                  name="name"
                  className="w-full px-4 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  value={editFormData.slug}
                  onChange={handleEditFormChange}
                  type="text"
                  name="slug"
                  className="w-full px-4 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false);
                    setSelectedSubcategoryId(null);
                    setEditFormData({ name: "", slug: "", categoryId: "" });
                  }}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Delete Subcategory</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Are you sure? This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedSubcategoryId(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {isLoading && (
          <p className="py-4 text-center text-gray-500 dark:text-gray-400">Loading...</p>
        )}
        {!isLoading && groupedByCategory.length === 0 && (
          <p className="py-6 text-center text-gray-500 dark:text-gray-400">No subcategories yet. Add one or select another category filter.</p>
        )}
        {!isLoading &&
          groupedByCategory.map(({ category, subcategories: subs }) => {
            const catId = category._id;
            const isExpanded = expandedCategoryIds.has(catId);
            const catName = category.name || "Unnamed category";
            return (
              <div
                key={catId}
                className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800"
              >
                <button
                  type="button"
                  onClick={() => toggleCategory(catId)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="font-medium text-gray-900 dark:text-white">{catName}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {subs.length} subcategory{subs.length !== 1 ? "ies" : ""}
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-slate-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                      <thead className="bg-gray-50 dark:bg-slate-700/30">
                        <tr>
                          <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Slug
                          </th>
                          <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                        {subs.map((sub) => (
                          <tr key={sub._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                            <td className="px-6 py-3 whitespace-nowrap text-gray-900 dark:text-white">{sub.name}</td>
                            <td className="px-6 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400">{sub.slug}</td>
                            <td className="px-6 py-3 whitespace-nowrap text-right">
                              <div className="flex gap-3 justify-end">
                                <button
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 text-sm"
                                  onClick={() => openEdit(sub)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 text-sm"
                                  onClick={() => {
                                    setDeleteModalOpen(true);
                                    setSelectedSubcategoryId(sub._id);
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default Subcategories;
