"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

export default function Home() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Give Header time to verify auth (small delay)
    const timer = setTimeout(() => {
      setHasChecked(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Helper function to get department code
  const getDepartmentCode = (department: any): string => {
    if (!department) return "";
    if (typeof department === "string") return department.toLowerCase();
    if (department.code) return department.code.toLowerCase();
    if (department.name) return department.name.toLowerCase();
    return "";
  };

  useEffect(() => {
    // Wait for auth check to complete
    if (!hasChecked) return;

    // If user is logged in, redirect to their dashboard based on department
    if (user) {
      const deptCode = getDepartmentCode(user.department);
      if (deptCode === "admin") router.push("/dashboards/admin");
      else if (deptCode === "delivery") router.push("/dashboards/delivery");
      else if (deptCode === "support") router.push("/dashboards/support");
      else if (deptCode === "vendor") router.push("/dashboards/vendor");
    } else {
      // If not logged in, redirect to login
      router.push("/login");
    }
  }, [user, router, hasChecked]);

  // Show loading while checking auth
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Loading...</p>
    </div>
  );
}
