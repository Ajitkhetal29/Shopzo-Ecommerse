"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "@/lib/api";
import { toast } from "react-toastify";

type Category = {
    _id: string;
    name: string;
    slug: string;
};

const Categories = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [addCategoryModalOpen, setAddCategoryModalOpen] = useState(false);
    const [deleteCategoryModalOpen, setDeleteCategoryModalOpen] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [editCategoryModalOpen, setEditCategoryModalOpen] = useState(false);
    const [addCategoryFormData, setAddCategoryFormData] = useState({
        name: "",
        slug: "",
    });
    const [editCategoryFormData, setEditCategoryFormData] = useState({
        name: "",
        slug: "",
    });

    // Generate slug from name
    const generateSlug = (name: string): string => {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    };

    const fetchCategories = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(API_ENDPOINTS.GET_CATEGORIES, { withCredentials: true });
            if (response.data.success) {
                setCategories(response.data.categories);
            } else {
                setError(response.data.message || "Failed to fetch categories");
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            setError("Failed to fetch categories. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddCategory = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.post(API_ENDPOINTS.CREATE_CATEGORY, addCategoryFormData, { withCredentials: true });
            if (response.data.success) {
                setAddCategoryFormData({ name: "", slug: "" });
                setAddCategoryModalOpen(false);
                fetchCategories(); // Refresh list
                toast.success("Category added successfully",{autoClose: 3000});
            } else {
                setError(response.data.message || "Failed to add category");
                toast.error(response.data.message || "Failed to add category",{autoClose: 3000});
            }
        } catch (error: any) {
            console.error("Error adding category:", error);
            setError(error.response?.data?.message || "Failed to add category. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditCategory = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedCategoryId) return;
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.put(`${API_ENDPOINTS.UPDATE_CATEGORY}/${selectedCategoryId}`, editCategoryFormData, { withCredentials: true });
            if (response.data.success) {
                setEditCategoryFormData({ name: "", slug: "" });
                setEditCategoryModalOpen(false);
                setSelectedCategoryId(null);
                fetchCategories(); // Refresh list
                toast.success("Category updated successfully",{autoClose: 3000});
            } else {
                setError(response.data.message || "Failed to update category");
                toast.error(response.data.message || "Failed to update category",{autoClose: 3000});
            }
        } catch (error: any) {
            console.error("Error editing category:", error);
            setError(error.response?.data?.message || "Failed to edit category. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteCategory = async () => {
        if (!selectedCategoryId) return;
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.delete(`${API_ENDPOINTS.DELETE_CATEGORY}/${selectedCategoryId}`, { withCredentials: true });
            if (response.data.success) {
                setDeleteCategoryModalOpen(false);
                setSelectedCategoryId(null);
                fetchCategories(); // Refresh list
            } else {
                setError(response.data.message || "Failed to delete category");
            }
        } catch (error: any) {
            console.error("Error deleting category:", error);
            setError(error.response?.data?.message || "Failed to delete category. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditCategoryClick = (category: Category) => {
        setSelectedCategoryId(category._id);
        setEditCategoryFormData({
            name: category.name,
            slug: category.slug,
        });
        setEditCategoryModalOpen(true);
    };

    const handleAddCategoryFormData = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const updatedData = { ...addCategoryFormData, [name]: value };
        
        // Auto-generate slug when name changes
        if (name === 'name') {
            updatedData.slug = generateSlug(value);
        }
        
        setAddCategoryFormData(updatedData);
    };

    const handleEditCategoryFormData = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const updatedData = { ...editCategoryFormData, [name]: value };
        
        // Auto-generate slug when name changes
        if (name === 'name') {
            updatedData.slug = generateSlug(value);
        }
        
        setEditCategoryFormData(updatedData);
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    return (
        <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Product Categories</h2>
                <button onClick={() => setAddCategoryModalOpen(true)} className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
                    Add Category
                </button>
            </div>

            {error && (
                <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Add Category Modal */}
            {addCategoryModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add Category</h2>
                        <form onSubmit={handleAddCategory}>
                            <div className="mb-4">
                                <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category Name <span className="text-red-500">*</span></label>
                                <input value={addCategoryFormData.name} onChange={handleAddCategoryFormData} type="text" id="categoryName" name="name" className="w-full px-4 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-colors text-sm" placeholder="Enter category name" required />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="categorySlug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Slug <span className="text-red-500">*</span></label>
                                <input value={addCategoryFormData.slug} onChange={handleAddCategoryFormData} type="text" id="categorySlug" name="slug" className="w-full px-4 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-colors text-sm" placeholder="category-slug" required />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => {
                                    setAddCategoryModalOpen(false);
                                    setAddCategoryFormData({ name: "", slug: "" });
                                }} className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">Cancel</button>
                                <button type="submit" disabled={isLoading} className="flex-1 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50">Add Category</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Category Modal */}
            {editCategoryModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Edit Category</h2>
                        <form onSubmit={handleEditCategory}>
                            <div className="mb-4">
                                <label htmlFor="editCategoryName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category Name <span className="text-red-500">*</span></label>
                                <input value={editCategoryFormData.name} onChange={handleEditCategoryFormData} type="text" id="editCategoryName" name="name" className="w-full px-4 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-colors text-sm" placeholder="Enter category name" required />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="editCategorySlug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Slug <span className="text-red-500">*</span></label>
                                <input value={editCategoryFormData.slug} onChange={handleEditCategoryFormData} type="text" id="editCategorySlug" name="slug" className="w-full px-4 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-colors text-sm" placeholder="category-slug" required />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => {
                                    setEditCategoryModalOpen(false);
                                    setEditCategoryFormData({ name: "", slug: "" });
                                    setSelectedCategoryId(null);
                                }} className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">Cancel</button>
                                <button type="submit" disabled={isLoading} className="flex-1 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50">Update Category</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Category Modal */}
            {deleteCategoryModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Delete Category</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">Are you sure you want to delete this category? This action cannot be undone.</p>
                        <div className="flex gap-3 justify-end">
                            <button className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium" onClick={() => {
                                setDeleteCategoryModalOpen(false);
                                setSelectedCategoryId(null);
                            }}>Cancel</button>
                            <button className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium" onClick={handleDeleteCategory}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-4">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Slug</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                        {categories.map((category) => (
                            <tr key={category._id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{category.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">{category.slug}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex gap-3">
                                        <button className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300" onClick={() => handleEditCategoryClick(category)}>
                                            Edit
                                        </button>
                                        <button className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300" onClick={() => {
                                            setDeleteCategoryModalOpen(true);
                                            setSelectedCategoryId(category._id);
                                        }}>
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Categories;
