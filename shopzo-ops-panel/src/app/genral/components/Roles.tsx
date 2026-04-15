"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { RootState } from "@/store";
import { setRoles, deleteRole, addRole } from "@/store/slices/genralSlice";
import axios from "axios";
import { API_ENDPOINTS } from "@/lib/api";

const Roles = () => {
    const dispatch = useDispatch<AppDispatch>();
    const roles = useSelector((state: RootState) => state.general.roles);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [addRoleModalOpen, setAddRoleModalOpen] = useState(false);
    const [deleteRoleModalOpen, setDeleteRoleModalOpen] = useState(false);
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
    const [addRoleFormData, setAddRoleFormData] = useState({
        name: "",
        description: "",
    });

    const fetchRoles = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(API_ENDPOINTS.GET_ROLES, { withCredentials: true });
            if (response.data.success) {
                dispatch(setRoles(response.data.roles));
            } else {
                setError(response.data.message || "Failed to fetch roles");
            }
        } catch (error) {
            console.error("Error fetching roles:", error);
            setError("Failed to fetch roles. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddRole = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.post(API_ENDPOINTS.CREATE_ROLE, addRoleFormData, { withCredentials: true });
            if (response.data.success) {
                dispatch(addRole(response.data.role));
                setAddRoleFormData({ name: "", description: "" });
                setAddRoleModalOpen(false);
            } else {
                setError(response.data.message || "Failed to add role");
            }
        } catch (error: any) {
            console.error("Error adding role:", error);
            setError(error.response?.data?.message || "Failed to add role. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteRole = async () => {
        if (!selectedRoleId) return;
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.delete(`${API_ENDPOINTS.DELETE_ROLE}/${selectedRoleId}`, { withCredentials: true });
            if (response.data.success) {
                dispatch(deleteRole(selectedRoleId));
                setDeleteRoleModalOpen(false);
                setSelectedRoleId(null);
            } else {
                setError(response.data.message || "Failed to delete role");
            }
        } catch (error: any) {
            console.error("Error deleting role:", error);
            setError(error.response?.data?.message || "Failed to delete role. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddRoleFormData = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setAddRoleFormData({ ...addRoleFormData, [e.target.name]: e.target.value });
    };

    // Fetch on mount
    useEffect(() => {
        fetchRoles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Roles</h2>
                <button onClick={() => setAddRoleModalOpen(true)} className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
                    Add Role
                </button>
            </div>

            {error && (
                <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Add Role Modal */}
            {addRoleModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add Role</h2>
                        <form onSubmit={handleAddRole}>
                            <div className="mb-4">
                                <label htmlFor="roleName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role Name <span className="text-red-500">*</span></label>
                                <input value={addRoleFormData.name} onChange={handleAddRoleFormData} type="text" id="roleName" name="name" className="w-full px-4 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-colors text-sm" placeholder="Enter role name" required />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="roleDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role Description</label>
                                <textarea value={addRoleFormData.description} onChange={handleAddRoleFormData} id="roleDescription" name="description" className="w-full px-4 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-colors text-sm" placeholder="Enter role description" />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => {
                                    setAddRoleModalOpen(false);
                                    setAddRoleFormData({ name: "", description: "" });
                                }} className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">Cancel</button>
                                <button type="submit" disabled={isLoading} className="flex-1 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50">Add Role</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Role Modal */}
            {deleteRoleModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Delete Role</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">Are you sure you want to delete this role? This action cannot be undone.</p>
                        <div className="flex gap-3 justify-end">
                            <button className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium" onClick={() => setDeleteRoleModalOpen(false)}>Cancel</button>
                            <button className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium" onClick={handleDeleteRole}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-4">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Department</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                        {roles.map((role) => (
                            <tr key={role._id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{role.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                                    {typeof role.department === 'object' ? role.department?.name : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300" onClick={() => {
                                        setDeleteRoleModalOpen(true);
                                        setSelectedRoleId(role._id);
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

export default Roles;
