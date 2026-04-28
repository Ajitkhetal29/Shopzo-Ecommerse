"use client";

import React, { useEffect, useState } from "react";
import { API_ENDPOINTS } from "@/lib/api";
import axios from "axios";
import { toast } from "react-toastify";
import { RootState } from "@/store";
import { useSelector } from "react-redux";

type User = {
    _id: string;
    name: string;
    email: string;

    department: {
        _id: string;
        name: string;
    };
    role: {
        _id: string;
        name: string;
        level: number;
    };
};


type Reporting = {
    _id: string;
    user: {
        _id: string;
        name: string;
        email: string;
    } | string;
    reportingTo: {
        _id: string;
        name: string;
        email: string;
    } | string;
    department: {
        _id: string;
        name: string;
    } | string;
};



const UserReportingPage = () => {


    const departments = useSelector((state: RootState) => state.general.departments);

    const [userReporting, setUserReporting] = useState<Reporting[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
    })

    const [totalReportings, setTotalReportings] = useState(0)
    const [filter, setFilter] = useState({
        department: '',
    })
    const [formData, setFormData] = useState({
        userId: '',
        reportingToId: '',
        department: '',
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const [users, setUsers] = useState<User[]>([])
    const [reportsTo, setReportsTo] = useState<User[]>([])
    const [reportToForUpdating, setReportsToForUpdating] = useState<User[]>([])
    const [existingReporting, setExistingReporting] = useState<Reporting | null>(null)
    const [showModal, setShowModal] = useState(false)

    // update
    const [updatingReporting, setUpdatingReporting] = useState(false)
    const [reportingToUpdate, setReportingToUpdate] = useState<string>('')
    const [updateModal, setUpdateModal] = useState(false);
    const [updateFormData, setUpdateFormData] = useState({
        userId: '',
        reportingToId: '',
        department: '',
    })







    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("formData", formData)
        try {
            const res = await axios.post(`${API_ENDPOINTS.CREATE_REPORTING}`, formData, {
                withCredentials: true,
            })
            if (res.data.success) {
                toast.success(res.data.message)
                const currentDepartment = formData.department
                setFormData({
                    userId: '',
                    reportingToId: '',
                    department: currentDepartment, // Keep department selected
                })
                setReportsTo([])
                setExistingReporting(null)
                fetchUserReporting()
                // Refresh user list if department was selected
                if (currentDepartment) {
                    fetchUsersForReporting(currentDepartment)
                } else {
                    setUsers([])
                }
            }
            else {
                toast.error(res.data.message)
            }
        } catch (error) {
            console.error(error)
            toast.error('failed to add user reporting')
        }
    }

    const checkUserReporting = async (userId: string, departmentId: string) => {
        try {
            const res = await axios.get(`${API_ENDPOINTS.CHECK_REPORTING}`, {
                withCredentials: true,
                params: { userId, departmentId }
            })
            if (res.data.success && res.data.hasReporting) {
                setExistingReporting(res.data.userReporting)
                setShowModal(true)
                return true
            }
            return false
        } catch (error) {
            console.error('Failed to check user reporting:', error)
            return false
        }
    }

    const handleDeleteReporting = async (reportingId: string) => {
        try {
            const res = await axios.delete(`${API_ENDPOINTS.DELETE_REPORTING}/${reportingId}`, {
                withCredentials: true,
            })
            if (res.data.success) {
                toast.success(res.data.message)
                setShowModal(false)
                setExistingReporting(null)
                setFormData(prev => ({ ...prev, userId: '', reportingToId: '' }))
                fetchUserReporting()
                if (formData.department) {
                    fetchUsersForReporting(formData.department)
                }
            } else {
                toast.error(res.data.message)
            }
        } catch (error) {
            console.error(error)
            toast.error('Failed to delete reporting')
        }
    }

    const fetchUsersForReporting = async (departmentId: string) => {
        try {
            const res = await axios.get(`${API_ENDPOINTS.GET_ALL_USERS_WITH_ROLE_AND_DEPARTMENT}`, {
                withCredentials: true,
                params: { departmentId }
            })
            if (res.data.success) {
                setUsers(res.data.users)
            }
            else {
                toast.error(res.data.message)
            }

        } catch (error) {
            console.error(error)
            toast.error('failed to fetch users for reporting')
        }
    }


    // ================= UPDATE INIT =================
    const hanldeupdatingExistingReprting = () => {
        if (!existingReporting) return;

        const userId =
            typeof existingReporting.user === "object"
                ? existingReporting.user._id
                : existingReporting.user;

        const reportingToId =
            typeof existingReporting.reportingTo === "object"
                ? existingReporting.reportingTo._id
                : existingReporting.reportingTo;

        const departmentId =
            typeof existingReporting.department === "object"
                ? existingReporting.department._id
                : existingReporting.department;

        setUpdateFormData({
            userId,
            reportingToId,
            department: departmentId,
        });

        const selectedUser = users.find(u => u._id === userId);

        if (selectedUser) {
            filterReportToForUpdating(
                selectedUser.role.level,
                selectedUser.department._id
            );
        }
    };

    const handleUpdateformData = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setUpdateFormData(prev => ({ ...prev, [name]: value }));
    }









    useEffect(() => {
        fetchUserReporting()
    }, [pagination.page, pagination.limit, filter.department])





    const fetchUserReporting = async () => {

        setLoading(true)

        try {

            const res = await axios.get(`${API_ENDPOINTS.GET_REPORTING}`, {
                withCredentials: true,
                params: {
                    page: pagination.page,
                    limit: pagination.limit,
                    department: filter.department || ''
                }
            }
            )

            if (res.data.success) {
                setUserReporting(res.data.userReportings)
                setTotalReportings(res.data.total)
                setLoading(false)
            }
            else {
                toast.error(res.data.message)
            }

        } catch (error) {
            console.error(error)
            setError('failed to fetch user reporting')
        }
        finally {
            setLoading(false)
        }

    }


    const filterReportsTo = (level: number, userDepartmentId: string) => {
        const filtered = users.filter(user =>
            user.role.level < level &&
            user.department._id === userDepartmentId
        );
        setReportsTo(filtered);
    };

    const filterReportToForUpdating = (level: number, userDepartmentId: string) => {
        const filtered = users.filter(user =>
            user.role.level < level &&
            user.department._id === userDepartmentId &&
            user._id !== updateFormData.userId
        );
        setReportsToForUpdating(filtered);
    }


    const handleUpdateSubmit = async () => {
        try {
            console.log("Update Form Data:", updateFormData);

            const payload = {
                user: updateFormData.userId,
                reportingTo: updateFormData.reportingToId,
            };

            const res = await axios.put(
                `${API_ENDPOINTS.UPDATE_REPORTING}/${reportingToUpdate}`,
                payload,
                { withCredentials: true }
            );

            if (res.data.success) {
                toast.success(res.data.message);

                // reset states
                setUpdatingReporting(false);
                setExistingReporting(null);

                setFormData(prev => ({
                    ...prev,
                    userId: '',
                    reportingToId: ''
                }));

                fetchUserReporting();

                if (updateFormData.department) {
                    fetchUsersForReporting(updateFormData.department);
                }

            } else {
                toast.error(res.data.message);
            }

        } catch (error) {
            console.error(error);
            toast.error("Failed to update reporting");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="text-center">
                    <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading reporting data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-7 sm:space-y-8">
            <div className="border-b border-slate-200/80 pb-6 dark:border-slate-700/60">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-[2rem] lg:leading-tight">
                            User reporting
                        </h1>
                        <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-slate-600 dark:text-slate-400">
                            Manage reporting relationships between users and team leads.
                        </p>
                    </div>
                    <div>
                        <select
                            name="filterDepartment"
                            id="filterDepartment"
                            value={filter.department}
                            onChange={(e) => {
                                setFilter({ ...filter, department: e.target.value })
                                setPagination(prev => ({ ...prev, page: 1 }))
                            }}
                            className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                        >
                            <option value="">All Departments</option>
                            {departments.map((dept) => (
                                <option key={dept._id} value={dept._id}>
                                    {dept.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-card p-5 shadow-sm dark:border-slate-600/80 dark:bg-slate-800/80 sm:p-6">
                <h2 className="mb-1 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Add user reporting</h2>
                <p className="mb-6 text-[0.8125rem] text-slate-500 dark:text-slate-400">Define who reports to whom in each department</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div>
                                <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Department <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="department"
                                    id="department"
                                    value={formData.department}
                                    onChange={(e) => {
                                        const departmentId = e.target.value;
                                        setFormData(prev => ({
                                            ...prev,
                                            department: departmentId,
                                            userId: '',
                                            reportingToId: ''
                                        }));
                                        setReportsTo([]);
                                        setExistingReporting(null);
                                        if (departmentId) {
                                            fetchUsersForReporting(departmentId);
                                        } else {
                                            setUsers([]);
                                        }
                                    }}
                                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                                >
                                    <option value="">Select Department</option>
                                    {departments.map((dept) => (
                                        <option key={dept._id} value={dept._id}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="userId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    User <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="userId"
                                    name="userId"
                                    value={formData.userId}
                                    onChange={async (e) => {
                                        const userId = e.target.value;
                                        setFormData(prev => ({
                                            ...prev,
                                            userId: userId,
                                            reportingToId: ''
                                        }));

                                        if (userId && formData.department) {
                                            // Check if user already has reporting manager
                                            const hasReporting = await checkUserReporting(userId, formData.department);
                                            if (!hasReporting) {
                                                // User doesn't have reporting, show dropdown
                                                const selectedUser = users.find(user => user._id === userId);
                                                if (selectedUser) {
                                                    // Filter by role level AND department
                                                    filterReportsTo(selectedUser.role.level, selectedUser.department._id);
                                                } else {
                                                    setReportsTo([]);
                                                }
                                            }
                                        } else {
                                            setReportsTo([]);
                                        }
                                    }}
                                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                                    required
                                >
                                    <option value="">Select user</option>
                                    {users.map((user) => (
                                        <option key={user._id} value={user._id}>{user.name} , {user.role.level}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="reportingToId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Reporting To <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="reportingToId"
                                    name="reportingToId"
                                    value={formData.reportingToId}
                                    onChange={handleInputChange}
                                    disabled={!!existingReporting}
                                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                                    required
                                >
                                    <option value="">Select reporting to</option>
                                    {reportsTo.map((user) => (
                                        <option key={user._id} value={user._id}>{user.name}, {user.role.level}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={!!existingReporting}
                                    className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add Reporting
                                </button>
                            </div>
                        </div>



                        {existingReporting && (
                            <div
                                className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                                onClick={() => setShowModal(true)}
                            >
                                <div className="flex items-start">
                                    <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <div className="flex-1">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 mb-2">
                                            Already has reporting manager
                                        </span>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-2">
                                            Current Manager: <span className="text-yellow-700 dark:text-yellow-300">{typeof existingReporting.reportingTo === 'object' ? existingReporting.reportingTo.name : 'N/A'}</span>
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                            Click to view details or delete
                                        </p>
                                    </div>
                                    <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        )}


                        {updatingReporting && (
                            <div
                                className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"

                            >

                                <div>
                                    <p>User</p>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white mt-2">
                                        {typeof existingReporting?.user === 'object' ? existingReporting.user.name : 'N/A'}
                                    </span>

                                </div>

                                <div>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 mb-2">
                                        Updating reporting manager
                                    </span>
                                    <select
                                        id="reportingToId"
                                        name="reportingToId"
                                        value={updateFormData.reportingToId}
                                        onChange={handleUpdateformData}
                                        // onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors text-sm"
                                        required
                                    >
                                        <option value="">Select reporting to</option>
                                        {reportToForUpdating.map((user) => (
                                            <option key={user._id} value={user._id}>
                                                {user.name}, {user.role.level}
                                            </option>
                                        ))}

                                    </select>
                                    <button
                                        type="button"
                                        onClick={handleUpdateSubmit}
                                        className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg"
                                    >
                                        Update Manager
                                    </button>
                                </div>
                            </div>
                        )}





                    </form>

                    {/* Modal for existing reporting */}
                    {showModal && existingReporting && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                            <div
                                className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                        Existing Reporting Manager
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setShowModal(false)
                                            setExistingReporting(null)
                                            setFormData(prev => ({ ...prev, userId: '', reportingToId: '' }))
                                        }}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-4 mb-6">
                                    <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">User</span>
                                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                                            {typeof existingReporting.user === 'object' ? existingReporting.user.name : 'N/A'}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            {typeof existingReporting.user === 'object' ? existingReporting.user.email : ''}
                                        </p>
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">Current Manager</span>
                                        <p className="mt-1 text-sm font-medium text-blue-900 dark:text-blue-100">
                                            {typeof existingReporting.reportingTo === 'object' ? existingReporting.reportingTo.name : 'N/A'}
                                        </p>
                                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                                            {typeof existingReporting.reportingTo === 'object' ? existingReporting.reportingTo.email : ''}
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Department</span>
                                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                                            {typeof existingReporting.department === 'object' ? existingReporting.department.name : 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowModal(false)
                                            setExistingReporting(null)
                                            setFormData(prev => ({ ...prev, userId: '', reportingToId: '' }))
                                        }}
                                        className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                    >
                                        Close
                                    </button>



                                    <button
                                        onClick={() => {
                                            setReportingToUpdate(existingReporting._id);

                                            setUpdatingReporting(true); // 🔥 IMPORTANT

                                            hanldeupdatingExistingReprting();

                                            setShowModal(false); // close modal
                                        }}
                                        className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                    >
                                        Update Reporting
                                    </button>



                                    <button
                                        onClick={() => {
                                            const reportingId = typeof existingReporting._id === 'string' ? existingReporting._id : String(existingReporting._id)
                                            handleDeleteReporting(reportingId)
                                        }}
                                        className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                    >
                                        Delete Reporting
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Reporting Relationships Table */}
                {!userReporting || userReporting.length === 0 ? (
                    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-card shadow-sm dark:border-slate-600/80 dark:bg-slate-800/80">
                        <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                            No reporting relationships found. Create your first reporting relationship above.
                        </div>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-card shadow-sm dark:border-slate-600/80 dark:bg-slate-800/80">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                <thead className="bg-slate-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Reporting To</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Department</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800/80">
                                    {userReporting.map((report) => {
                                        const user = typeof report.user === 'object' ? report.user : { name: 'N/A', email: 'N/A' };
                                        const reportingTo = typeof report.reportingTo === 'object' ? report.reportingTo : { name: 'N/A', email: 'N/A' };
                                        const department = typeof report.department === 'object' ? report.department : { name: 'N/A' };
                                        return (
                                            <tr key={report._id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</div>
                                                    <div className="text-sm text-slate-600 dark:text-slate-400">{user.email}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-slate-900 dark:text-white">{reportingTo.name}</div>
                                                    <div className="text-sm text-slate-600 dark:text-slate-400">{reportingTo.email}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium capitalize text-sky-800 dark:bg-sky-900/40 dark:text-sky-200">
                                                        {department.name}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <button
                                                        onClick={() => handleDeleteReporting(report._id)}
                                                        className="font-semibold text-red-600 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <div className="flex items-center justify-between bg-slate-50 px-6 py-3 dark:bg-slate-700/40">
                                <div className="text-sm text-slate-700 dark:text-slate-300">
                                    Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, totalReportings)} of {totalReportings} relationships
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

                                            if (pageNum <= 0 || pageNum > Math.ceil(totalReportings / pagination.limit)) {
                                                return null;
                                            }

                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                                                    className={`mx-1 px-3 py-1 rounded-md text-sm font-medium ${pagination.page === pageNum
                                                        ? 'bg-amber-600 text-white'
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
                                        disabled={pagination.page * pagination.limit >= totalReportings}
                                        className={`px-3 py-1 rounded-md text-sm font-medium ${pagination.page * pagination.limit >= totalReportings ? 'bg-gray-300 dark:bg-slate-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors'}`}
                                    >
                                        Next
                                    </button>


                                </div>

                                <div>
                                    <select
                                        value={pagination.limit}
                                        onChange={(e) => setPagination(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                                        className="ml-3 rounded-md border border-slate-300 bg-white text-sm text-slate-700 transition-colors focus:border-amber-500 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                    >

                                        <option value={10}>10 </option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                    </select>
                                </div>

                            </div>
                        </div>
                    </div>
                )}
            </div>
    );






};

export default UserReportingPage;
