"use client";

import { API_ENDPOINTS } from "@/lib/api";
import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type TransferVariant = {
    _id: string;
    sku?: string;
};

type TransferParty = {
    _id: string;
    name: string;
};

type TransferItem = {
    variant: TransferVariant;
    quantity: number;
};

type TransferStatusHistory = {
    status: string;
    changedAt: string;
    changedByType?: string;
    changedById?: TransferParty | string;
    changedByName?: string;
};

type TransferRequestDetail = {
    _id: string;
    fromType: string;
    toType: string;
    fromId?: TransferParty;
    toId?: TransferParty;
    status: string;
    initiatedAt: string;
    items: TransferItem[];
    statusHistory: TransferStatusHistory[];
};

const TransferRequestDetailPage = () => {
    const params = useParams<{ id: string }>();
    const transferId = useMemo(() => {
        const id = params?.id;
        return Array.isArray(id) ? id[0] : id;
    }, [params]);

    const [transferRequest, setTransferRequest] = useState<TransferRequestDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTransferRequest = async () => {
        if (!transferId) return;
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(API_ENDPOINTS.GET_INVENTORY_TRANSFER_REQUEST_BY_ID, {
                withCredentials: true,
                params: { id: transferId },
            });
            if (response.data.success) {
                setTransferRequest(response.data.transfer);
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || err.message || "Failed to fetch transfer request");
            } else {
                setError("Failed to fetch transfer request");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransferRequest();
    }, [transferId]);

    const formatDate = (date?: string) => {
        if (!date) return "-";
        const parsed = new Date(date);
        if (Number.isNaN(parsed.getTime())) return "-";
        return parsed.toLocaleString();
    };

    const getChangedByName = (history: TransferStatusHistory) => {
        if (history.changedByName) return history.changedByName;
        if (history.changedById && typeof history.changedById === "object" && "name" in history.changedById) {
            return history.changedById.name || "-";
        }
        return "-";
    };

    const totalQuantity = transferRequest?.items?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) ?? 0;

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-900">
                <div className="text-lg text-gray-600 dark:text-gray-300">Loading transfer details...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-slate-900">
                <div className="mx-auto max-w-5xl">
                    <Link href="/transfer-requests" className="mb-4 inline-flex text-sm text-gray-700 underline dark:text-slate-200">
                        Back to Transfer Requests
                    </Link>
                    <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-300">
                        {error}
                    </div>
                </div>
            </div>
        );
    }

    if (!transferRequest) {
        return (
            <div className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-slate-900">
                <div className="mx-auto max-w-5xl">
                    <Link href="/transfer-requests" className="mb-4 inline-flex text-sm text-gray-700 underline dark:text-slate-200">
                        Back to Transfer Requests
                    </Link>
                    <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        Transfer request not found.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-slate-900">
            <div className="mx-auto max-w-5xl space-y-6">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <Link href="/transfer-requests" className="text-sm text-gray-700 underline dark:text-slate-200">
                            Back to Transfer Requests
                        </Link>
                        <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">Transfer Request Details</h1>
                    </div>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold capitalize text-gray-800 dark:bg-slate-700 dark:text-slate-100">
                        {transferRequest.status}
                    </span>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                        <p className="text-xs text-gray-500 dark:text-slate-400">From</p>
                        <p className="mt-1 font-semibold capitalize text-gray-900 dark:text-white">{transferRequest.fromType}</p>
                        <p className="text-sm text-gray-700 dark:text-slate-300">{transferRequest.fromId?.name || "-"}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                        <p className="text-xs text-gray-500 dark:text-slate-400">To</p>
                        <p className="mt-1 font-semibold capitalize text-gray-900 dark:text-white">{transferRequest.toType}</p>
                        <p className="text-sm text-gray-700 dark:text-slate-300">{transferRequest.toId?.name || "-"}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                        <p className="text-xs text-gray-500 dark:text-slate-400">Initiated Date</p>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                            {formatDate(transferRequest.initiatedAt)}
                        </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                        <p className="text-xs text-gray-500 dark:text-slate-400">Total Quantity</p>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{totalQuantity}</p>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                    <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Items</h2>
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                            <thead className="bg-gray-50 dark:bg-slate-900">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-300">
                                        SKU
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-300">
                                        Quantity
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                {transferRequest.items.map((item, index) => (
                                    <tr key={`${item.variant?._id || "variant"}-${index}`}>
                                        <td className="px-3 py-2 text-sm text-gray-700 dark:text-slate-300">
                                            {item.variant?.sku || "-"}
                                        </td>
                                        <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
                                            {item.quantity}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                    <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Status History</h2>
                    <div className="space-y-3">
                        {transferRequest.statusHistory?.map((history, index) => (
                            <div
                                key={`${history.status}-${history.changedAt}-${index}`}
                                className="rounded-lg border border-gray-200 px-3 py-2 dark:border-slate-700"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-sm font-medium capitalize text-gray-900 dark:text-white">
                                        {history.status}
                                    </span>
                                    <span className="text-sm text-gray-600 dark:text-slate-300">
                                        {formatDate(history.changedAt)}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-gray-700 dark:text-slate-300">
                                    Changed By: {getChangedByName(history)}
                                    {history.changedByType ? ` (${history.changedByType})` : ""}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransferRequestDetailPage;
