"use client";

import React from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import axios from "axios";
import { API_ENDPOINTS } from "@/lib/api";
import { setDashboardStats } from "@/store/slices/dashboardStats";
import { useDispatch } from "react-redux";

const AdminDashboardPage = () => {

  const dispatch = useDispatch();
const dashboardStats = useSelector((state: RootState) => state.dashboardStats);


 const fetchDashboardData = async () => {

  const result =await axios.get(API_ENDPOINTS.GET_DASHBOARD_STATS, {withCredentials : true})
  if (result.data.success){
    dispatch(setDashboardStats(result.data.stats));
  }
 }

 if (!dashboardStats || dashboardStats.totalUsers === 0) {
  fetchDashboardData();
 }


  const stats = [
    { name: "Total Users", value: dashboardStats.totalUsers?.toString() || "0", icon: "👥", href: "/users", color: "bg-blue-500" },
    { name: "Warehouses", value: dashboardStats.totalWarehouses?.toString() || "0", icon: "🏭", href: "/warehouse", color: "bg-green-500" },
    { name: "Vendors", value: dashboardStats.totalVendors?.toString() || "0", icon: "🏢", href: "/vendor", color: "bg-indigo-500" },
    { name: "Departments", value: dashboardStats.totalDepartments?.toString() || "0", icon: "🏛️", href: "/genral", color: "bg-teal-500" },
    { name: "Roles", value: dashboardStats.totalRoles?.toString() || "0", icon: "👔", href: "/genral", color: "bg-pink-500" },
    { name: "Orders", value: 0, icon: "📦", href: "/orders", color: "bg-purple-500" },
    { name: "Products", value: dashboardStats.totalProducts?.toString() || "0", icon: "🛍️", href: "/products", color: "bg-orange-500" },
  ];

  const quickActions = [
    { name: "Add User", href: "/users/add", icon: "➕" },
    { name: "Add Warehouse", href: "/warehouse/add", icon: "🏭" },
    { name: "Add Vendor", href: "/vendor/add", icon: "🏢" },
    { name: "Manage General", href: "/genral", icon: "⚙️" },
    { name: "View Orders", href: "/orders", icon: "📋" },
    { name: "Manage Products", href: "/products", icon: "📦" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Overview of your e-commerce operations</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 mb-8">
          {stats.map((stat) => (
            <Link
              key={stat.name}
              href={stat.href}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 hover:shadow-md transition-all"
            >
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className="flex items-center p-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-black dark:hover:border-white transition-colors"
              >
                <span className="text-2xl mr-3">{action.icon}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{action.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No recent activity to display</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;  