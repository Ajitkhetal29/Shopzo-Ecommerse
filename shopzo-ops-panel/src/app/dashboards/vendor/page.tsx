"use client";

import React from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import type { User } from "@/store/types/users";

const getDepartmentCode = (department: User["department"]): string => {
  if (!department) return "";
  if (typeof department === "string") return department.toLowerCase();
  if (department.code) return department.code.toLowerCase();
  if (department.name) return department.name.toLowerCase();
  return "";
};

const VendorDashboardPage = () => {
  const users = useSelector((state: RootState) => state.user.users);
  const vendorTeamMembers = users.filter((user) => getDepartmentCode(user.department) === "vendor");

  const stats = [
    { name: "Total Products", value: "0", icon: "🛍️", color: "bg-sky-600" },
    { name: "Active Orders", value: "0", icon: "📦", color: "bg-amber-500" },
    { name: "Revenue Today", value: "₹0", icon: "💰", color: "bg-green-500" },
    { name: "Team Members", value: vendorTeamMembers.length.toString(), icon: "👥", color: "bg-violet-600" },
  ];

  const quickActions = [
    { name: "Manage Products", href: "/products", icon: "🛍️" },
    { name: "View Orders", href: "/orders", icon: "📋" },
    { name: "Team Management", href: "#", icon: "👥" },
    { name: "Sales History", href: "#", icon: "📊" },
  ];

  return (
    <div className="space-y-7 sm:space-y-8">
      <div className="border-b border-slate-200/80 pb-6 dark:border-slate-700/60">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-[2rem] lg:leading-tight">
          Vendor dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-slate-600 dark:text-slate-400">
          Track product performance, active order volume, and sales momentum from a single view.
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          Key metrics
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="rounded-2xl border border-slate-200/80 bg-card p-5 shadow-sm transition-all hover:border-amber-500/35 hover:shadow-md dark:border-slate-600/80 dark:bg-slate-800/80 sm:p-6"
            >
              <div className="flex items-center gap-4">
                <div className={`${stat.color} flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl text-white shadow-sm`}>
                  <span aria-hidden>{stat.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[0.8125rem] font-medium text-slate-600 dark:text-slate-400">{stat.name}</p>
                  <p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-card p-5 shadow-sm dark:border-slate-600/80 dark:bg-slate-800/80 sm:p-6">
        <h2 className="mb-1 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Quick actions</h2>
        <p className="mb-4 text-[0.8125rem] text-slate-500 dark:text-slate-400">Common vendor workflows</p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="flex min-h-[3.25rem] items-center rounded-xl border border-slate-200/80 px-3 py-3 transition-colors hover:border-amber-500/40 hover:bg-amber-500/5 dark:border-slate-600 dark:hover:border-amber-400/30 dark:hover:bg-amber-500/10 sm:px-4"
            >
              <span className="mr-3 text-xl" aria-hidden>
                {action.icon}
              </span>
              <span className="text-[0.8125rem] font-semibold text-slate-900 dark:text-white">{action.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-card p-5 shadow-sm dark:border-slate-600/80 dark:bg-slate-800/80 sm:p-6">
        <h2 className="mb-1 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Recent orders</h2>
        <p className="mb-4 text-[0.8125rem] text-slate-500 dark:text-slate-400">Latest order activity</p>
        <div className="rounded-xl border border-dashed border-slate-200/90 py-14 text-center dark:border-slate-600/80">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No recent orders to display</p>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboardPage;