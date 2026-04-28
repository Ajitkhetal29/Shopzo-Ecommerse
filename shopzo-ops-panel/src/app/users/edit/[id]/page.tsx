"use client";
import { useParams, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
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
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const dispatch = useDispatch<AppDispatch>();
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
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading user data...</p>
          </div>
        </div>
      );
    }

    if (error && !formData) {
      return (
        <div className="rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
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
        <div className="space-y-7 sm:space-y-8">
            <div className="border-b border-slate-200/80 pb-6 dark:border-slate-700/60">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-[2rem] lg:leading-tight">
                    Edit user
                </h1>
                <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-slate-600 dark:text-slate-400">
                    Update user profile, department, and role permissions.
                </p>
            </div>

            {error ? (
                <div className="rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                    {error}
                </div>
            ) : null}

            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-card shadow-sm dark:border-slate-600/80 dark:bg-slate-800/80">
                <div className="border-b border-slate-200/80 bg-slate-50 px-6 py-4 dark:border-slate-700/80 dark:bg-slate-700/40">
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">User details</h2>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-5 p-6">
                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData?.name || ''}
                                    onChange={handleInputChange}
                                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                                    placeholder="Enter user name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData?.email || ''}
                                    onChange={handleInputChange}
                                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                                    placeholder="Enter email address"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Department <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="department"
                                    name="department"
                                    value={formData?.department || ''}
                                    onChange={handleInputChange}
                                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
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
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Role <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="role"
                                    name="role"
                                    value={formData?.role || ''}
                                    onChange={handleInputChange}
                                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
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
                        </div>

                            <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() => router.push('/users')}
                                    className="rounded-xl border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`flex-1 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all ${isLoading
                                            ? "cursor-not-allowed bg-slate-400 text-white"
                                            : "bg-amber-600 text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:ring-offset-2"
                                        }`}
                                >
                                    {isLoading ? "Updating..." : "Update User"}
                                </button>
                            </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUserPage;