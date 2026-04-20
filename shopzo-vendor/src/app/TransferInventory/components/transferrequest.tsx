"use client";

import { API_ENDPOINTS } from "@/app/lib/api";
import axios from "axios";
import { useEffect, useState } from "react";

type TransferVariant = {
    _id: string;
    sku?: string;
    images?: string[];
};

type TransferParty = {
    _id: string;
    name: string;
};

type TransferItem = {
    variant: TransferVariant;
    quantity: number;
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
};

type TransferRequestProps = {
    isOpen: boolean;
    onClose: () => void;
    transferId: string | null;
};

const TransferRequest = ({ isOpen, onClose, transferId }: TransferRequestProps) => {
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
        if (!isOpen) {
            setTransferRequest(null);
            setError(null);
            return;
        }
        fetchTransferRequest();
    }, [isOpen, transferId]);

    if (!isOpen) return null;

    const formatDate = (date?: string) => {
        if (!date) return "-";
        const parsed = new Date(date);
        if (Number.isNaN(parsed.getTime())) return "-";
        return parsed.toLocaleString();
    };

    const totalQuantity = transferRequest?.items?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) ?? 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-3xl rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Transfer Request Details</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        Close
                    </button>
                </div>

                {loading && <p className="text-sm text-gray-600 dark:text-gray-300">Loading request details...</p>}

                {error && (
                    <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-300">
                        {error}
                    </div>
                )}

                {!loading && !error && transferRequest && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                                <p className="text-gray-500 dark:text-slate-400">From</p>
                                <p className="font-semibold capitalize text-gray-900 dark:text-white">
                                    {transferRequest.fromType}
                                </p>
                                <p className="text-gray-700 dark:text-slate-300">{transferRequest.fromId?.name || "-"}</p>
                            </div>

                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                                <p className="text-gray-500 dark:text-slate-400">To</p>
                                <p className="font-semibold capitalize text-gray-900 dark:text-white">
                                    {transferRequest.toType}
                                </p>
                                <p className="text-gray-700 dark:text-slate-300">{transferRequest.toId?.name || "-"}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                                <p className="text-gray-500 dark:text-slate-400">Initiated Date</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {formatDate(transferRequest.initiatedAt)}
                                </p>
                            </div>

                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                                <p className="text-gray-500 dark:text-slate-400">Total Quantity</p>
                                <p className="font-medium text-gray-900 dark:text-white">{totalQuantity}</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                                <thead className="bg-gray-50 dark:bg-slate-800">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-300">
                                            SKU
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-300">
                                            Quantity
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
                                    {transferRequest.items?.map((item, index) => (
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
                )}
            </div>
        </div>
    );
};

export default TransferRequest;