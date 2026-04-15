"use client";

import React from "react";
import Link from "next/link";

const vendorDashboardPage = () => {

  const stats = [
    { name: "Total Products", value: "0", icon: "🛍️", color: "bg-blue-500" },
    { name: "Active Orders", value: "0", icon: "📦", color: "bg-yellow-500" },
    { name: "Revenue Today", value: "₹0", icon: "💰", color: "bg-green-500" },
  ];

  const quickActions = [
    { name: "Manage Products", href: "/products", icon: "🛍️" },
    { name: "Stock", href: "/inventory", icon: "🏭" },
    { name: "View Orders", href: "/orders", icon: "📋" },
    { name: "Team Management", href: "/Team", icon: "👥" },
    { name: "Sales History", href: "/History", icon: "📊" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Vendor Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Manage your products and track sales</p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6"
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
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Orders</h2>
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No recent orders to display</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default vendorDashboardPage;