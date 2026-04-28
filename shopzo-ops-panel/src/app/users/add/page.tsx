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
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    role: "",
  });

  const dispatch = useDispatch();
  const departments = useSelector((state: RootState) => state.general.departments);
  const roles = useSelector((state: RootState) => state.general.roles);

  useEffect(() => {
    if (departments.length === 0) {
      axios
        .get(API_ENDPOINTS.GET_DEPARTMENTS, { withCredentials: true })
        .then((res) => {
          if (res.data.success) dispatch(setDepartments(res.data.departments));
        })
        .catch((err) => console.error("Error fetching departments:", err));
    }

    if (roles.length === 0) {
      axios
        .get(API_ENDPOINTS.GET_ROLES, { withCredentials: true })
        .then((res) => {
          if (res.data.success) dispatch(setRoles(res.data.roles));
        })
        .catch((err) => console.error("Error fetching roles:", err));
    }
  }, [dispatch, departments.length, roles.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "department") {
      setFormData({ ...formData, department: value, role: "" });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const response = await axios.post(API_ENDPOINTS.CREATE_OPS_USER, formData, { withCredentials: true });
      if (response.data.success) {
        dispatch(addUser(response.data.user as User));
        router.push("/users");
        toast.success("User added successfully");
      }
    } catch (err) {
      console.error("Add user error:", err);
      toast.error("Failed to add user");
      setError("Failed to add user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-7 sm:space-y-8">
      <div className="border-b border-slate-200/80 pb-6 dark:border-slate-700/60">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-[2rem] lg:leading-tight">
          Add user
        </h1>
        <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-slate-600 dark:text-slate-400">
          Create a new staff account with department and role permissions.
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

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                placeholder="Enter full name"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                placeholder="user@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              placeholder="Enter password"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div>
              <label htmlFor="department" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                id="department"
                name="department"
                value={formData.department}
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
              <label htmlFor="role" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                required
              >
                <option value="">Select role</option>
                {roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.name}
                  </option>
                ))}
              </select>
              {roles.length === 0 ? (
                <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">No roles available. Please create roles first.</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push("/users")}
              className="rounded-xl border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all ${
                isLoading
                  ? "cursor-not-allowed bg-slate-400 text-white"
                  : "bg-amber-600 text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:ring-offset-2"
              }`}
            >
              {isLoading ? "Adding..." : "Add User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserPage;