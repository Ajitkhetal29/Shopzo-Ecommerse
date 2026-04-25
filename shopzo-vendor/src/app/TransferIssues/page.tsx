"use client";

import { API_ENDPOINTS } from "@/app/lib/api";
import { RootState } from "@/store";
import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

type TransferIssueRow = {
  _id: string;
  transferRequest: string | null;
  transferStatus: string | null;
  fromName: string | null;
  toName: string | null;
  sku: string | null;
  issueType: "damaged" | "missing" | "extra";
  issueQuantity: number;
  issueStatus: "pending" | "in_progress" | "resolved";
  issueDescription: string;
  createdAt: string;
};

type IssueTab = "all" | "pending" | "in_progress" | "resolved";

const PAGE_SIZE = 10;

const TransferIssuesPage = () => {
  const vendor = useSelector((state: RootState) => state.auth.vendor);
  const [rows, setRows] = useState<TransferIssueRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState<IssueTab>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (!vendor?._id) return;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(API_ENDPOINTS.GET_TRANSFER_ISSUES, {
          withCredentials: true,
          params: {
            userType: "vendor",
            userId: vendor._id,
            issueStatus: statusTab,
            page,
            limit: PAGE_SIZE,
          },
        });
        if (res.data.success) {
          setRows(res.data.issues ?? []);
          setTotalPages(Math.max(1, Number(res.data.totalPages) || 1));
          setTotalCount(Number(res.data.totalCount) || 0);
        } else {
          setError(res.data.message || "Failed to load transfer issues");
        }
      } catch (e: unknown) {
        if (axios.isAxiosError(e)) {
          setError(e.response?.data?.message || e.message);
        } else {
          setError("Failed to load transfer issues");
        }
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [vendor?._id, statusTab, page]);

  const formatDate = (date?: string) => {
    if (!date) return "-";
    const d = new Date(date);
    return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Transfer Issues</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Issues raised on transfer settlement</p>
        </div>

        <div className="mb-6 flex items-center gap-2 overflow-x-auto">
          {(["all", "pending", "in_progress", "resolved"] as IssueTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setStatusTab(tab);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                statusTab === tab
                  ? "bg-black dark:bg-white text-white dark:text-black"
                  : "bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading && (
          <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center text-gray-600 dark:text-gray-300">
            Loading transfer issues...
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-12 text-center text-gray-600 dark:text-gray-300">
            No transfer issues found
          </div>
        )}

        {!loading && rows.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700/80">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">Issue</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">SKU</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">Transfer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">Raised At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {rows.map((row) => (
                  <tr key={row._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 capitalize text-gray-900 dark:text-white">{row.issueType}</td>
                    <td className="px-4 py-3 font-mono text-gray-700 dark:text-slate-300">{row.sku || "-"}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-900 dark:text-white">{row.issueQuantity}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-slate-300">
                      {row.transferRequest ? (
                        <Link className="underline" href={`/TransferInventory/${row.transferRequest}`}>
                          View Transfer
                        </Link>
                      ) : (
                        "-"
                      )}
                      <div className="text-xs text-gray-500 dark:text-slate-400">
                        {row.fromName || "-"} to {row.toName || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-700 dark:text-slate-300">{row.issueStatus}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-slate-300">{formatDate(row.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalCount > 0 && (
          <div className="mt-8 flex items-center justify-between gap-4 border-t border-gray-200 dark:border-slate-700 pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {totalPages} - {totalCount} total
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm text-gray-700 dark:text-slate-200 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm text-gray-700 dark:text-slate-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransferIssuesPage;
