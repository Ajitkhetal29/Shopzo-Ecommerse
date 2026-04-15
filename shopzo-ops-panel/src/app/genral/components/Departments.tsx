"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { RootState } from "@/store";
import { setDepartments, deleteDepartment, addDepartment } from "@/store/slices/genralSlice";
import axios from "axios";
import { API_ENDPOINTS } from "@/lib/api";

const Departments = () => {
    const dispatch = useDispatch<AppDispatch>();
    const departments = useSelector((state: RootState) => state.general.departments);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [addDepartmentModalOpen, setAddDepartmentModalOpen] = useState(false);
    const [deleteDepartmentModalOpen, setDeleteDepartmentModalOpen] = useState(false);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
    const [addDepartmentFormData, setAddDepartmentFormData] = useState({
        name: "",
        description: "",
    });

    const fetchDepartments = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(API_ENDPOINTS.GET_DEPARTMENTS, { withCredentials: true });
            if (response.data.success) {
                dispatch(setDepartments(response.data.departments));
            } else {
                setError(response.data.message || "Failed to fetch departments");
            }
        } catch (error) {
            console.error("Error fetching departments:", error);
            setError("Failed to fetch departments. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddDepartment = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.post(API_ENDPOINTS.CREATE_DEPARTMENT, addDepartmentFormData, { withCredentials: true });
            if (response.data.success) {
                dispatch(addDepartment(response.data.department));
                setAddDepartmentFormData({ name: "", description: "" });
                setAddDepartmentModalOpen(false);
            } else {
                setError(response.data.message || "Failed to add department");
            }
        } catch (error: any) {
            console.error("Error adding department:", error);
            setError(error.response?.data?.message || "Failed to add department. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteDepartment = async () => {
        if (!selectedDepartmentId) return;
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.delete(`${API_ENDPOINTS.DELETE_DEPARTMENT}/${selectedDepartmentId}`, { withCredentials: true });
            if (response.data.success) {
                dispatch(deleteDepartment(selectedDepartmentId));
                setDeleteDepartmentModalOpen(false);
                setSelectedDepartmentId(null);
            } else {
                setError(response.data.message || "Failed to delete department");
            }
        } catch (error: any) {
            console.error("Error deleting department:", error);
            setError(error.response?.data?.message || "Failed to delete department. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddDepartmentFormData = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setAddDepartmentFormData({ ...addDepartmentFormData, [e.target.name]: e.target.value });
    };

    // Fetch on mount
    useEffect(() => {
        fetchDepartments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Departments</h2>
                <button onClick={() => setAddDepartmentModalOpen(true)} className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
                    Add Department
                </button>
            </div>

            {error && (
                <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Add Department Modal */}
            {addDepartmentModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add Department</h2>
                        <form onSubmit={handleAddDepartment}>
                            <div className="mb-4">
                                <label htmlFor="departmentName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department Name</label>
                                <input value={addDepartmentFormData.name} onChange={handleAddDepartmentFormData} type="text" id="departmentName" name="name" className="w-full px-4 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-colors text-sm" placeholder="Enter department name" required />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="departmentDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department Description</label>
                                <textarea value={addDepartmentFormData.description} onChange={handleAddDepartmentFormData} id="departmentDescription" name="description" className="w-full px-4 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-colors text-sm" placeholder="Enter department description" required />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => {
                                    setAddDepartmentModalOpen(false);
                                    setAddDepartmentFormData({ name: "", description: "" });
                                }} className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">Cancel</button>
                                <button type="submit" disabled={isLoading} className="flex-1 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50">Add Department</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Department Modal */}
            {deleteDepartmentModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Delete Department</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">Are you sure you want to delete this department? This action cannot be undone.</p>
                        <div className="flex gap-3 justify-end">
                            <button className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium" onClick={() => setDeleteDepartmentModalOpen(false)}>Cancel</button>
                            <button className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium" onClick={handleDeleteDepartment}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-4">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                        {departments.map((department) => (
                            <tr key={department._id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{department.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300" onClick={() => {
                                        setDeleteDepartmentModalOpen(true);
                                        setSelectedDepartmentId(department._id);
                                    }}>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Departments;
