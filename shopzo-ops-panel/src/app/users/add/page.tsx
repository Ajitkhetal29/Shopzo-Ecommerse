"use client";

import { useState, useEffect } from "react";
import { User } from "@/store/types/users";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { addUser } from "@/store/slices/userSlice";
import { setDepartments, setRoles } from "@/store/slices/genralSlice";
import axios from "axios";
import { API_ENDPOINTS } from "@/lib/api";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const AddUserPage = () => {

    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        department: '',
        role: '',
    });
    const dispatch = useDispatch();
    const departments = useSelector((state: RootState) => state.general.departments);
    const roles = useSelector((state: RootState) => state.general.roles);

    useEffect(() => {
        // Fetch departments if not in store
        if (departments.length === 0) {
            axios.get(API_ENDPOINTS.GET_DEPARTMENTS, { withCredentials: true })
                .then((res) => {
                    if (res.data.success) {
                        dispatch(setDepartments(res.data.departments));
                    }
                })
                .catch((err) => console.error("Error fetching departments:", err));
        }

        // Fetch roles if not in store
        if (roles.length === 0) {
            axios.get(API_ENDPOINTS.GET_ROLES, { withCredentials: true })
                .then((res) => {
                    if (res.data.success) {
                        dispatch(setRoles(res.data.roles));
                    }
                })
                .catch((err) => console.error("Error fetching roles:", err));
        }
    }, [dispatch, departments.length, roles.length]);

    // Filter roles by selected department


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        // Reset role when department changes
        if (name === 'department') {
            setFormData({ ...formData, department: value, role: '' });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!formData) return;
        setIsLoading(true);
        try {
            const response = await axios.post(API_ENDPOINTS.CREATE_OPS_USER, formData, { withCredentials: true });
            if (response.data.success) {
                dispatch(addUser(response.data.user));
                router.push("/users");
                toast.success("User added successfully");

            }
        }
        catch (error) {
            console.error("Add user error:", error);
            toast.error("Failed to add user");
            setError("Failed to add user");
        }
        finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Add User</h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Create a new staff account with department and role permissions</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">User Details</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData?.name || ''}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-colors text-sm"
                                placeholder="Enter full name"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData?.email || ''}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-colors text-sm"
                                placeholder="user@example.com"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData?.password || ''}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-colors text-sm"
                                placeholder="Enter password"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Department <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="department"
                                name="department"
                                value={formData?.department || ''}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-colors text-sm"
                                required
                            >
                                <option value="">Select department</option>
                                {departments.map((dept) => (
                                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Role <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="role"
                                name="role"
                                value={formData?.role || ''}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-colors text-sm"
                                required
                            >
                                <option value="">
                                    {"Select role"}
                                </option>
                                {roles.map((role) => (
                                    <option key={role._id} value={role._id}>{role.name}</option>
                                ))}
                            </select>
                            {roles.length === 0 && (
                                <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
                                    No roles available. Please create roles first.
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => router.push('/users')}
                                className="px-6 py-3 rounded-lg font-medium text-sm transition-all bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-slate-500 focus:ring-offset-2"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`flex-1 px-6 py-3 rounded-lg font-medium text-sm transition-all ${isLoading
                                        ? "bg-gray-400 text-white cursor-not-allowed"
                                        : "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:ring-offset-2 shadow-sm"
                                    }`}
                            >
                                {isLoading ? "Adding..." : "Add User"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddUserPage;