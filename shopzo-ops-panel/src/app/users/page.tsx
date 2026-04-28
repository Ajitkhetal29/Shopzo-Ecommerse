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
  });

  const [filter, setFilter] = useState({
    department: "",
    role: "",
  });

  const totalPages = Math.max(1, Math.ceil(totalUsers / pagination.limit));
  const startCount = totalUsers === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endCount = Math.min(pagination.page * pagination.limit, totalUsers);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get(API_ENDPOINTS.GET_OPS_USERS, {
        withCredentials: true,
        params: {
          page: pagination.page,
          limit: pagination.limit,
          department: filter.department || "",
          role: filter.role || "",
        },
      });
      if (response.status === 200) {
        dispatch(setUsers(response.data.users));
        setTotalUsers(response.data.total);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to fetch users. Please try again.");
      toast.error("Failed to fetch users. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await axios.delete(`${API_ENDPOINTS.DELETE_OPS_USER}/${id}`, { withCredentials: true });
      if (response.status === 200) {
        dispatch(deleteUser(id));
        toast.success("User deleted successfully");
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      toast.error("Failed to delete user. Please try again.");
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, filter.department, filter.role]);

  return (
    <div className="space-y-7 sm:space-y-8">
      <div className="border-b border-slate-200/80 pb-6 dark:border-slate-700/60">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-[2rem] lg:leading-tight">
          Users
        </h1>
        <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-slate-600 dark:text-slate-400">
          Manage staff accounts, departments, roles, and access lifecycle.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-card p-4 shadow-sm dark:border-slate-600/80 dark:bg-slate-800/80 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              name="department"
              id="department"
              className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
              value={filter.department}
              onChange={(e) => setFilter({ ...filter, department: e.target.value })}
            >
              <option value="">All Departments</option>
              {Departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>

            <select
              name="role"
              id="role"
              className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
              value={filter.role}
              onChange={(e) => setFilter({ ...filter, role: e.target.value })}
            >
              <option value="">All Roles</option>
              {Roles.map((role) => (
                <option key={role._id} value={role._id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <Link
            href="/users/add"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {deletModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">Delete User</h2>
            <p className="mb-6 text-slate-600 dark:text-slate-400">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletModalOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDelete(selectedUserId as string);
                  setDeletModalOpen(false);
                }}
                className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-card shadow-sm dark:border-slate-600/80 dark:bg-slate-800/80">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800/80">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      No users found.{" "}
                      <Link href="/users/add" className="font-semibold text-amber-700 hover:underline dark:text-amber-300">
                        Add your first user
                      </Link>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20">
                            <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{user.email}</td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-800 dark:bg-sky-900/40 dark:text-sky-200">
                          {typeof user.department === "string" ? user.department : user.department?.name || user.department?.code || "N/A"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm capitalize text-slate-600 dark:text-slate-400">
                        {typeof user.role === "string" ? user.role.replace("_", " ") : user.role?.name || user.role?.code || "N/A"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <div className="flex gap-3">
                          <Link
                            href={`/users/edit/${user._id}`}
                            className="font-semibold text-slate-700 transition-colors hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => {
                              setDeletModalOpen(true);
                              setSelectedUserId(user._id);
                            }}
                            className="font-semibold text-red-600 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
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
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-700/40 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Showing {startCount} to {endCount} of {totalUsers} users
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
              disabled={pagination.page === 1}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                pagination.page === 1
                  ? "cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-600 dark:text-slate-400"
                  : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              Previous
            </button>

            {Array.from({ length: 5 }, (_, i) => {
              const pageNum = pagination.page - 2 + i;
              if (pageNum <= 0 || pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPagination((prev) => ({ ...prev, page: pageNum }))}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    pagination.page === pageNum
                      ? "bg-amber-600 text-white"
                      : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= totalPages}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                pagination.page >= totalPages
                  ? "cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-600 dark:text-slate-400"
                  : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              Next
            </button>

            <select
              value={pagination.limit}
              onChange={(e) => setPagination((prev) => ({ ...prev, limit: parseInt(e.target.value, 10), page: 1 }))}
              className="ml-1 h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-700 outline-none transition focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPage;