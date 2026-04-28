"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import axios from "axios";
import { API_ENDPOINTS } from "@/lib/api";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "@/store/slices/authSlice";
import { useRouter, usePathname } from "next/navigation";
import { RootState } from "@/store";
import ThemeToggleButton from "@/app/components/ThemeToggleButton";
import { publicUrl } from "@/lib/basePath";

const LoginPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const user = useSelector((state: RootState) => state.auth.user);
  const hasRedirected = useRef(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const getDepartmentCode = (department: { code?: string; name?: string } | string | undefined): string => {
    if (!department) return "";
    if (typeof department === "string") return department.toLowerCase();
    if (department.code) return department.code.toLowerCase();
    if (department.name) return department.name.toLowerCase();
    return "";
  };

  useEffect(() => {
    if (pathname !== "/login" || hasRedirected.current) return;

    if (user) {
      hasRedirected.current = true;
      const deptCode = getDepartmentCode(user.department);
      if (deptCode === "admin") router.push("/dashboards/admin");
      else if (deptCode === "delivery") router.push("/dashboards/delivery");
      else if (deptCode === "support") router.push("/dashboards/support");
      else if (deptCode === "vendor") router.push("/dashboards/vendor");
    }
  }, [user, router, pathname]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(API_ENDPOINTS.LOGIN, formData, {
        withCredentials: true,
      });

      if (!res.data.success) {
        setError(res.data.message || "Login failed");
        return;
      }

      const loggedIn = res.data.user;
      dispatch(setUser(loggedIn));

      const deptCode = getDepartmentCode(loggedIn.department);
      if (deptCode === "admin") router.push("/dashboards/admin");
      else if (deptCode === "delivery") router.push("/dashboards/delivery");
      else if (deptCode === "support") router.push("/dashboards/support");
      else if (deptCode === "vendor") router.push("/dashboards/vendor");
      else setError("Invalid department. Contact admin.");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh w-full overflow-x-hidden pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]">
      <div className="pointer-events-none absolute inset-0 bg-slate-100 dark:bg-slate-950" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(245,158,11,0.16),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(245,158,11,0.12),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMCIgY3k9IjAiIHI9IjEiIGZpbGw9InJnYmEoMTUsMjMsNDIsMC4wNikiLz48L3N2Zz4=')] opacity-70 dark:opacity-40"
        aria-hidden
      />

      <ThemeToggleButton
        className={[
          "fixed z-20 rounded-full border p-2.5 shadow-sm backdrop-blur-sm",
          "border-slate-200/90 bg-white/95 text-slate-600 hover:bg-slate-50",
          "dark:border-slate-600/80 dark:bg-slate-800/95 dark:text-amber-100/90 dark:hover:bg-slate-700/90",
          "right-[max(0.75rem,env(safe-area-inset-right))] top-[max(0.75rem,env(safe-area-inset-top))]",
        ].join(" ")}
      />

      <div className="relative z-[1] flex w-full flex-1 flex-col lg:min-h-0 lg:flex-row">
        <div
          className={[
            "relative flex flex-col border-b",
            "border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900",
            "dark:border-white/10 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-white",
            "px-4 py-4 sm:px-6 sm:py-6",
            "shrink-0 lg:max-w-[44%] lg:min-h-dvh lg:flex-1 lg:justify-between lg:border-b-0 lg:border-r lg:border-slate-200/80 lg:px-12 lg:py-12 dark:lg:border-white/10",
          ].join(" ")}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-400/[0.07] via-transparent to-slate-200/40 dark:from-amber-500/20 dark:via-transparent dark:to-slate-950/90"
            aria-hidden
          />
          <div className="relative max-w-sm lg:max-w-none">
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-amber-600 sm:text-xs dark:text-amber-300/90">
              Shopzo
            </p>
            <h1 className="mt-1.5 text-2xl font-semibold leading-[1.15] tracking-tight text-slate-900 sm:mt-2.5 sm:text-3xl lg:text-4xl dark:text-white">
              Operations
              <span className="mt-0.5 block text-base font-normal text-slate-500 sm:mt-1 sm:text-lg dark:text-slate-300">
                console
              </span>
            </h1>
            <p className="mt-2.5 line-clamp-2 text-xs leading-snug text-slate-600 sm:mt-3 sm:line-clamp-none sm:text-sm sm:leading-relaxed dark:text-slate-400">
              Catalog, orders, vendors & teams — your e‑commerce operations hub.
            </p>
            <p className="mt-2 text-[0.65rem] text-slate-500 sm:text-xs lg:hidden dark:text-slate-500">
              Authorized staff only.
            </p>
          </div>
          <p className="relative mt-4 hidden text-xs text-slate-500 lg:mt-0 lg:block dark:text-slate-500">
            For authorized staff only.
          </p>
        </div>

        <div
          className={[
            "flex min-h-0 flex-1 flex-col",
            "bg-slate-50/95 dark:bg-slate-950/40",
            "px-4 py-3 sm:px-6 sm:py-6 lg:justify-center lg:px-12 lg:py-8",
            "items-stretch sm:items-center",
            "lg:bg-white lg:dark:bg-slate-950/60",
            "lg:shadow-[inset_1px_0_0_0_rgb(226_232_240_/_0.9)] lg:dark:shadow-[inset_1px_0_0_0_rgb(255_255_255_/_0.06)]",
          ].join(" ")}
        >
          <div className="mx-auto w-full max-w-[380px] rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:max-w-[400px] sm:p-6 lg:max-w-[420px] dark:border-transparent dark:bg-transparent dark:p-0 dark:shadow-none lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:dark:p-0">
            <div className="mb-4 flex justify-center sm:mb-5 lg:mb-6">
              <div className="relative h-12 w-[9.5rem] overflow-hidden sm:h-14 sm:w-[11rem] lg:h-16 lg:w-[12.5rem]">
                <Image
                  src={publicUrl("/shopzo_logo.png")}
                  alt="Shopzo"
                  fill
                  sizes="(max-width: 640px) 152px, (max-width: 1024px) 176px, 200px"
                  className="object-contain object-center scale-[1.55] dark:hidden"
                  priority
                />
                <Image
                  src={publicUrl("/shopzo_logo_tp.png")}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 152px, (max-width: 1024px) 176px, 200px"
                  className="hidden object-contain object-center scale-[1.55] dark:block"
                  priority
                  aria-hidden
                />
              </div>
            </div>

            <div className="mb-4 sm:mb-6 lg:mb-10">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                Sign in
              </h2>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 sm:mt-1.5 sm:text-sm">
                Work email and password
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-5" noValidate>
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-1.5 block text-sm font-medium text-slate-800 dark:text-slate-200"
                >
                  Email
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/25 sm:px-4 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100 dark:focus:border-amber-500/50 dark:focus:ring-amber-500/20"
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="mb-1.5 block text-sm font-medium text-slate-800 dark:text-slate-200"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white/90 py-2.5 pl-3 pr-12 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/25 sm:pl-4 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100 dark:focus:border-amber-500/50 dark:focus:ring-amber-500/20"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:ring-offset-2 focus:ring-offset-slate-100 disabled:cursor-not-allowed disabled:opacity-50 sm:py-3 dark:focus:ring-offset-slate-900"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    </svg>
  );
}

export default LoginPage;
