"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

export default function Home() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);

  const getDepartmentCode = (department: { code?: string; name?: string } | string | undefined): string => {
    if (!department) return "";
    if (typeof department === "string") return department.toLowerCase();
    if (department.code) return department.code.toLowerCase();
    if (department.name) return department.name.toLowerCase();
    return "";
  };

  useEffect(() => {
    if (!user) return;
    const deptCode = getDepartmentCode(user.department);
    if (deptCode === "admin") router.replace("/dashboards/admin");
    else if (deptCode === "delivery") router.replace("/dashboards/delivery");
    else if (deptCode === "support") router.replace("/dashboards/support");
    else if (deptCode === "vendor") router.replace("/dashboards/vendor");
  }, [user, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-100 dark:bg-slate-950">
      <div className="text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Redirecting…</p>
      </div>
    </div>
  );
}
