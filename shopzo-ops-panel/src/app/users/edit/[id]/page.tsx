"use client";
import { useParams, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { useState, useEffect, useRef } from "react";
import { User } from "@/store/types/users";

type Department = {
    _id: string;
    name: string;
    code?: string;
};

type Role = {
    _id: string;
    name: string;
    department: string | Department;
    code?: string;
};
import { updateUser, setUsers } from "@/store/slices/userSlice";

import axios from "axios";
import { API_ENDPOINTS } from "@/lib/api";
import { toast } from "react-toastify";


const EditUserPage = () => {
    const { id } = useParams();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState<{
        name?: string;
        email?: string;
        department?: string;
        role?: string;
        [key: string]: any;
    } | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);

    const users = useSelector((state: RootState) => state.user.users);
    const fetchedUser = users.find((user: any) => user._id === id);
    const hasFetched = useRef(false);

    // Fetch departments and roles
    useEffect(() => {
        const fetchDepartmentsAndRoles = async () => {
            try {
                const [deptResponse, roleResponse] = await Promise.all([
                    axios.get(API_ENDPOINTS.GET_DEPARTMENTS, { withCredentials: true }),
                    axios.get(API_ENDPOINTS.GET_ROLES, { withCredentials: true })
                ]);

                if (deptResponse.data.success) {
                    // Exclude buyer department
                    const depts = deptResponse.data.departments.filter((dept: Department) => 
                        dept.name?.toLowerCase() !== 'buyer'
                    );
                    setDepartments(depts);
                }

                if (roleResponse.data.success) {
                    setRoles(roleResponse.data.roles);
                }
            } catch (err) {
                console.error("Error fetching departments/roles:", err);
            }
        };

        fetchDepartmentsAndRoles();
    }, []);

    // Filter roles based on selected department
    useEffect(() => {
        if (formData?.department && roles.length > 0) {
            const deptId = formData.department as string;
            
            const filtered = roles.filter((role: Role) => {
                const roleDeptId = typeof role.department === 'object' 
                    ? (role.department as Department)._id 
                    : role.department;
                return roleDeptId === deptId;
            });
            setFilteredRoles(filtered);
        } else {
            setFilteredRoles([]);
        }
    }, [formData?.department, roles]);

    useEffect(() => {
        if (fetchedUser) {
            setUser(fetchedUser);
            // Extract IDs from populated objects
            const deptId = typeof fetchedUser.department === 'object' 
                ? fetchedUser.department._id 
                : fetchedUser.department;
            const roleId = typeof fetchedUser.role === 'object' 
                ? fetchedUser.role._id 
                : fetchedUser.role;
            
            setFormData({
                ...fetchedUser,
                department: deptId,
                role: roleId,
            });
        } else if (id && !hasFetched.current) {
            // If user not in Redux, fetch all users (only once)
            hasFetched.current = true;
            setIsLoading(true);
            axios.get(API_ENDPOINTS.GET_OPS_USERS, {
                withCredentials: true,
            })
            .then((response) => {
                if (response.status === 200) {
                    dispatch(setUsers(response.data.users));
                    const user = response.data.users.find((u: User) => u._id === id);
                    if (user) {
                        setUser(user);
                        // Extract IDs from populated objects
                        const deptId = typeof user.department === 'object' 
                            ? user.department._id 
                            : user.department;
                        const roleId = typeof user.role === 'object' 
                            ? user.role._id 
                            : user.role;
                        
                        setFormData({
                            ...user,
                            department: deptId,
                            role: roleId,
                        });
                    } else {
                        setError("User not found");
                    }
                }
            })
            .catch((err: any) => {
                const errorMessage = err.response?.data?.message || "Failed to fetch user";
                setError(errorMessage);
                toast.error(errorMessage);
            })
            .finally(() => {
                setIsLoading(false);
            });
        }
    }, [id, fetchedUser, dispatch]);

    if (isLoading && !formData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-base font-medium text-gray-900">Loading user data...</p>
                </div>
            </div>
        );
    }

    if (error && !formData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => router.push('/users')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Back to Users
                    </button>
                </div>
            </div>
        );
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (formData) {
            const newFormData = { ...formData, [e.target.name]: e.target.value };
            
            // If department changed, reset role and filter roles
            if (e.target.name === 'department') {
                newFormData.role = '';
            }
            
            setFormData(newFormData);
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!formData) return;
        setIsLoading(true);
        try {
            const response = await axios.put(`${API_ENDPOINTS.UPDATE_OPS_USER}/${id}`, formData, {
                withCredentials: true,
            });
            if (response.status === 200) {
                dispatch(updateUser(response.data));
                toast.success("User updated successfully");
                router.push('/users');
            }
            setError("");
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || "Failed to update user";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }



    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Edit User</h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Update user information and permissions</p>
                </div>

                {error && (
                    <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">User Details</h2>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData?.name || ''}
                                    onChange={handleInputChange}
                                    className="w-full text-gray-900 dark:text-white bg-white dark:bg-slate-700 px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-colors text-sm"
                                    placeholder="Enter user name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData?.email || ''}
                                    onChange={handleInputChange}
                                    className="w-full text-gray-900 dark:text-white bg-white dark:bg-slate-700 px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-colors text-sm"
                                    placeholder="Enter email address"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                                        <option key={dept._id} value={dept._id}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Role <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="role"
                                    name="role"
                                    value={formData?.role || ''}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-colors text-sm disabled:opacity-50"
                                    required
                                    disabled={!formData?.department}
                                >
                                    <option value="">
                                        {formData?.department ? 'Select role' : 'Select department first'}
                                    </option>
                                    {filteredRoles.map((role) => (
                                        <option key={role._id} value={role._id}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
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
                                    {isLoading ? "Updating..." : "Update User"}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditUserPage;