"use client";

import { API_ENDPOINTS } from "@/lib/api";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { deleteUser, setUsers } from "@/store/slices/userSlice";
import { AppDispatch } from "@/store";
import { RootState } from "@/store";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import Link from "next/link";

const UserPage = () => {

    const Roles = useSelector((state: RootState) => state.general.roles);
    const Departments = useSelector((state: RootState) => state.general.departments);

    const dispatch = useDispatch<AppDispatch>();
    const users = useSelector((state: RootState) => state.user.users);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deletModalOpen, setDeletModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [totalUsers, setTotalUsers] = useState(0);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,

    })

    const [filter, setFilter] = useState({
        department: "",
        role: ""
    });


    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(API_ENDPOINTS.GET_OPS_USERS, {
                withCredentials: true,
                params: {
                    page: pagination.page,
                    limit: pagination.limit,
                    department: filter.department || '',
                    role: filter.role || ''
                }
            });
            if (response.status === 200) {
                dispatch(setUsers(response.data.users));
                setTotalUsers(response.data.total);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            setError("Failed to fetch users. Please try again.");
            toast.error("Failed to fetch users. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    const handleDelete = async (id: string) => {
        try {
            const response = await axios.delete(`${API_ENDPOINTS.DELETE_OPS_USER}/${id}`, { withCredentials: true });
            if (response.status === 200) {
                dispatch(deleteUser(id));
                toast.success("User deleted successfully");
            }
        } catch (error) {
            console.error("Error deleting user:", error);
            toast.error("Failed to delete user. Please try again.");
        }
    }


    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.page, pagination.limit, filter.department, filter.role]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
                <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
                <div className="text-red-600 dark:text-red-400">{error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Users</h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage staff accounts and permissions</p>
                    </div>
                    <div>
                        
                        <select name="department" id="department" className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors" value={filter.department} onChange={(e) => setFilter({...filter, department: e.target.value})}>

                            <option value="">All Departments</option>
                            {Departments.map((dept) => (
                                <option key={dept._id} value={dept._id}>
                                    {dept.name}
                                </option>
                            ))}

                        </select>

                        <select name="role" id="role" className="ml-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors" value={filter.role} onChange={(e) => setFilter({...filter, role: e.target.value})}>

                            <option value="">All Roles</option> 
                            {Roles.map((role) => (
                                <option key={role._id} value={role._id}>
                                    {role.name}
                                </option>
                            ))}

                        </select>

                        <Link
                        href="/users/add"
                        className="inline-flex items-center justify-center px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add User
                    </Link>

                    </div>
                    
                </div>

                {/* Delete Modal */}
                {deletModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-700">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Delete User</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">Are you sure you want to delete this user? This action cannot be undone.</p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setDeletModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        handleDelete(selectedUserId as string);
                                        setDeletModalOpen(false);
                                    }}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Users Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                            <thead className="bg-gray-50 dark:bg-slate-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Department</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                            No users found. <Link href="/users/add" className="text-black dark:text-white font-medium hover:underline">Add your first user</Link>
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-8 w-8 rounded-full bg-black dark:bg-white flex items-center justify-center mr-3">
                                                        <span className="text-white dark:text-black text-sm font-semibold">
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 capitalize">
                                                    {typeof user.department === 'string' ? user.department : user.department?.name || user.department?.code || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                                    {typeof user.role === 'string' ? user.role.replace('_', ' ') : user.role?.name || user.role?.code || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex gap-3">
                                                    <Link
                                                        href={`/users/edit/${user._id}`}
                                                        className="text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300 font-medium transition-colors"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <button
                                                        onClick={() => {
                                                            setDeletModalOpen(true);
                                                            setSelectedUserId(user._id);
                                                        }}
                                                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        <div className="px-6 py-3 bg-gray-50 dark:bg-slate-700 flex items-center justify-between">
                            <div className="text-sm text-gray-700 dark:text-gray-400">
                                Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, totalUsers)} of {totalUsers} users
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                                    disabled={pagination.page === 1}
                                    className={`px-3 py-1 rounded-md text-sm font-medium ${pagination.page === 1 ? 'bg-gray-300 dark:bg-slate-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors'}`}
                                >
                                    Previous
                                </button>

                                <div>
                                    {Array.from({ length: 5 }, (_, i) => {
                                        const pageNum = pagination.page - 2 + i;

                                        if (pageNum <= 0 || pageNum > Math.ceil(totalUsers / pagination.limit)) {
                                            return null;
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                                                className={`mx-1 px-3 py-1 rounded-md text-sm font-medium ${pagination.page === pageNum
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}

                                </div>

                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                    disabled={pagination.page * pagination.limit >= totalUsers}
                                    className={`px-3 py-1 rounded-md text-sm font-medium ${pagination.page * pagination.limit >= totalUsers ? 'bg-gray-300 dark:bg-slate-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors'}`}
                                >
                                    Next
                                </button>


                            </div>

                            <div>
                                <select
                                    value={pagination.limit}
                                    onChange={(e) => setPagination(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                                    className="ml-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                >

                                    <option value={10}>10 </option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserPage;