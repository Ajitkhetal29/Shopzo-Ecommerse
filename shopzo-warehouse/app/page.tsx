import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center px-4 transition-colors">
      <main className="w-full max-w-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-8 text-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Shopzo Warehouse
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Manage transfers, inventory, and operations from the warehouse dashboard.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm font-medium"
          >
            Login
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:opacity-90 text-sm font-medium"
          >
            Open Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
