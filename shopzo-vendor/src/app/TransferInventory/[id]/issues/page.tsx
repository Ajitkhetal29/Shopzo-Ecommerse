"use client";

import { API_ENDPOINTS } from "@/app/lib/api";
import { RootState } from "@/store";
import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

type TransferIssue = {
    _id: string;
    issueType: "damaged" | "missing" | "extra";
    quantity: number;
    status: "reported" | "under_review" | "resolved";
    note?: string;
    variant?: { _id?: string; sku?: string };
    resolution?: { type?: string; note?: string; resolvedAt?: string };
};

const TransferIssuesPage = () => {
    const params = useParams<{ id: string }>();
    const transferId = useMemo(() => {
        const id = params?.id;
        return Array.isArray(id) ? id[0] : id;
    }, [params]);

    const vendor = useSelector((state: RootState) => state.auth.vendor);
    const [issues, setIssues] = useState<TransferIssue[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [updatingIssueId, setUpdatingIssueId] = useState<string | null>(null);
    const [resolutionTypeByIssue, setResolutionTypeByIssue] = useState<Record<string, string>>({});
    const [resolutionNoteByIssue, setResolutionNoteByIssue] = useState<Record<string, string>>({});

    const fetchIssues = async () => {
        if (!transferId || !vendor?._id) return;
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(API_ENDPOINTS.GET_TRANSFER_ISSUES, {
                withCredentials: true,
                params: {
                    transferId,
                    actorType: "vendor",
                    actorId: vendor._id,
                },
            });
            if (response.data.success) {
                setIssues(response.data.issues || []);
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || err.message || "Failed to fetch transfer issues");
            } else {
                setError("Failed to fetch transfer issues");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIssues();
    }, [transferId, vendor?._id]);

    const updateIssueStatus = async (issueId: string, status: "under_review") => {
        if (!vendor?._id) return;
        setUpdatingIssueId(issueId);
        setError(null);
        try {
            await axios.patch(
                API_ENDPOINTS.UPDATE_TRANSFER_ISSUE_STATUS,
                {
                    issueId,
                    status,
                    changedByType: "vendor",
                    changedById: vendor._id,
                },
                { withCredentials: true }
            );
            await fetchIssues();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || err.message || "Failed to update issue status");
            } else {
                setError("Failed to update issue status");
            }
        } finally {
            setUpdatingIssueId(null);
        }
    };

    const resolveIssue = async (issueId: string) => {
        if (!vendor?._id) return;
        const resolutionType = resolutionTypeByIssue[issueId];
        if (!resolutionType) {
            setError("Select a resolution type first.");
            return;
        }

        setUpdatingIssueId(issueId);
        setError(null);
        try {
            await axios.patch(
                API_ENDPOINTS.RESOLVE_TRANSFER_ISSUE,
                {
                    issueId,
                    resolutionType,
                    note: resolutionNoteByIssue[issueId] || "",
                    resolvedByType: "vendor",
                    resolvedById: vendor._id,
                },
                { withCredentials: true }
            );
            await fetchIssues();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || err.message || "Failed to resolve issue");
            } else {
                setError("Failed to resolve issue");
            }
        } finally {
            setUpdatingIssueId(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-slate-900">
            <div className="mx-auto max-w-5xl space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <Link href={`/TransferInventory/${transferId}`} className="text-sm text-gray-700 underline dark:text-slate-200">
                            Back to Transfer Detail
                        </Link>
                        <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">Transfer Issues</h1>
                    </div>
                </div>

                {loading && <p className="text-sm text-gray-600 dark:text-slate-300">Loading issues...</p>}
                {error && (
                    <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-300">
                        {error}
                    </div>
                )}

                {!loading && issues.length === 0 && (
                    <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        No issues found for this transfer.
                    </div>
                )}

                {issues.map((issue) => (
                    <div key={issue._id} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {issue.variant?.sku || "-"} - {issue.issueType}
                            </p>
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold capitalize text-gray-800 dark:bg-slate-700 dark:text-slate-100">
                                {issue.status}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-700 dark:text-slate-300">Quantity: {issue.quantity}</p>
                        {issue.note && <p className="mt-1 text-sm text-gray-700 dark:text-slate-300">Note: {issue.note}</p>}

                        {issue.status !== "resolved" && (
                            <div className="mt-4 space-y-2">
                                {issue.status === "reported" && (
                                    <button
                                        type="button"
                                        onClick={() => updateIssueStatus(issue._id, "under_review")}
                                        disabled={updatingIssueId === issue._id}
                                        className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                                    >
                                        Mark Under Review
                                    </button>
                                )}

                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <select
                                        value={resolutionTypeByIssue[issue._id] || ""}
                                        onChange={(e) =>
                                            setResolutionTypeByIssue((prev) => ({ ...prev, [issue._id]: e.target.value }))
                                        }
                                        className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                                    >
                                        <option value="">Select resolution</option>
                                        <option value="adjust">adjust</option>
                                        <option value="replace">replace</option>
                                        <option value="return">return</option>
                                    </select>
                                    <input
                                        type="text"
                                        value={resolutionNoteByIssue[issue._id] || ""}
                                        onChange={(e) =>
                                            setResolutionNoteByIssue((prev) => ({ ...prev, [issue._id]: e.target.value }))
                                        }
                                        placeholder="Resolution note (optional)"
                                        className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => resolveIssue(issue._id)}
                                        disabled={updatingIssueId === issue._id}
                                        className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                                    >
                                        Resolve Issue
                                    </button>
                                </div>
                            </div>
                        )}

                        {issue.status === "resolved" && issue.resolution?.type && (
                            <p className="mt-3 text-sm text-gray-700 dark:text-slate-300">
                                Resolved by: {issue.resolution.type}
                                {issue.resolution.note ? ` (${issue.resolution.note})` : ""}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TransferIssuesPage;
