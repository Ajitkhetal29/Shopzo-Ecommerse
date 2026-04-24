"use client";

import { API_ENDPOINTS } from "@/lib/api";
import axios from "axios";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { toast } from "react-toastify";

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

type StatusRulesResponse = {
    success: boolean;
    allowedStatuses?: string[];
};

type TransferRequestProps = {
    isOpen: boolean;
    onClose: () => void;
    transferId: string | null;
    initialStatus?: string;
    onSuccess?: () => void;
};

const TransferRequest = ({ isOpen, onClose, transferId, initialStatus, onSuccess }: TransferRequestProps) => {
    const warehouse = useSelector((state: RootState) => state.auth.warehouse);
    const [transferRequest, setTransferRequest] = useState<TransferRequestDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [allowedStatuses, setAllowedStatuses] = useState<string[]>([]);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [updatingStatus, setUpdatingStatus] = useState(false);

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

                const statusRulesResponse = await axios.get<StatusRulesResponse>(
                    API_ENDPOINTS.GET_INVENTORY_TRANSFER_STATUS_RULES,
                    {
                        withCredentials: true,
                        params: {
                            currentStatus: response.data.transfer?.status,
                            actorType: "warehouse",
                        },
                    }
                );
                const allowed = statusRulesResponse.data.allowedStatuses ?? [];
                setAllowedStatuses(allowed);
                if (initialStatus && allowed.includes(initialStatus)) {
                    setSelectedStatus(initialStatus);
                } else {
                    setSelectedStatus("");
                }

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
            setAllowedStatuses([]);
            setSelectedStatus("");
            return;
        }
        fetchTransferRequest();
    }, [isOpen, transferId, initialStatus]);

    if (!isOpen) return null;

    const formatDate = (date?: string) => {
        if (!date) return "-";
        const parsed = new Date(date);
        if (Number.isNaN(parsed.getTime())) return "-";
        return parsed.toLocaleString();
    };

    const totalQuantity = transferRequest?.items?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) ?? 0;

    const handleChangeStatus = async () => {
        if (!transferRequest?._id || !selectedStatus || !warehouse?._id) return;

        setUpdatingStatus(true);
        try {
            const response = await axios.patch(
                API_ENDPOINTS.UPDATE_INVENTORY_TRANSFER_STATUS,
                {
                    transferId: transferRequest._id,
                    newStatus: selectedStatus,
                    userType: "warehouse",
                    userId: warehouse._id,
                },
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success(response.data.message || "Status updated successfully");
                onSuccess?.();
                onClose();
            } else {
                toast.error(response.data.message || "Failed to update status");
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                toast.error(err.response?.data?.message || err.message || "Failed to update status");
            } else {
                toast.error("Failed to update status");
            }
        } finally {
            setUpdatingStatus(false);
        }
    };

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

                        <div className="flex items-center justify-end gap-2 border-t border-gray-200 pt-4 dark:border-slate-700">
                            <select
                                className="w-full max-w-xs rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                disabled={allowedStatuses.length === 0}
                            >
                                <option value="">
                                    {allowedStatuses.length > 0 ? "Select status" : "No status action available"}
                                </option>
                                {allowedStatuses.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="button"
                                onClick={handleChangeStatus}
                                disabled={!selectedStatus || updatingStatus}
                                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
                            >
                                {updatingStatus ? "Updating..." : "Change Status"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TransferRequest;
