"use client";

import { API_ENDPOINTS } from "@/lib/api";
import axios from "axios";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

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
    allowedStatuses?: string[];
};

type TransferRequestProps = {
    isOpen: boolean;
    onClose: () => void;
    transferId: string | null;
    forcedStatus?: string | null;
    onStatusUpdated?: () => void;
};

type DeliveryLine = {
    receivedQuantity: string;
    acceptedQuantity: string;
    damagedQuantity: string;
    missingQuantity: string;
    extraQuantity: string;
};

const SETTLEMENT_STATUSES = ["issue_reported", "completed"] as const;
const needsSettlement = (status: string) =>
    SETTLEMENT_STATUSES.includes(status as (typeof SETTLEMENT_STATUSES)[number]);

const emptyDeliveryLine = (): DeliveryLine => ({
    receivedQuantity: "",
    acceptedQuantity: "",
    damagedQuantity: "",
    missingQuantity: "",
    extraQuantity: "",
});

const variantKey = (item: TransferItem) => {
    const v = item.variant as unknown;
    if (typeof v === "string") return v;
    return String(item.variant?._id ?? "");
};

const TransferRequest = ({ isOpen, onClose, transferId, forcedStatus, onStatusUpdated }: TransferRequestProps) => {
    const warehouse = useSelector((state: RootState) => state.auth.warehouse);
    const [transferRequest, setTransferRequest] = useState<TransferRequestDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [deliveryByVariant, setDeliveryByVariant] = useState<Record<string, DeliveryLine>>({});

    const fetchTransferRequest = async () => {
        if (!transferId) return;
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(API_ENDPOINTS.GET_INVENTORY_TRANSFER_REQUEST_BY_ID, {
                withCredentials: true,
                params: {
                    id: transferId,
                    actorType: "warehouse",
                    actorId: warehouse?._id,
                },
            });
            if (response.data.success) {
                const t = response.data.transfer as TransferRequestDetail;
                setTransferRequest(t);
                setSelectedStatus(forcedStatus || "");
                const next: Record<string, DeliveryLine> = {};
                for (const it of t.items || []) {
                    const k = variantKey(it);
                    if (k) next[k] = emptyDeliveryLine();
                }
                setDeliveryByVariant(next);
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
            setSelectedStatus("");
            setDeliveryByVariant({});
            return;
        }
        fetchTransferRequest();
    }, [isOpen, transferId, warehouse?._id, forcedStatus]);

    const setDeliveryField = (variantId: string, field: keyof DeliveryLine, raw: string) => {
        const val = raw.replace(/[^0-9]/g, "");
        setDeliveryByVariant((prev) => {
            const base = prev[variantId] ?? emptyDeliveryLine();
            return { ...prev, [variantId]: { ...base, [field]: val } };
        });
    };

    const resetDeliveryAllAccepted = () => {
        if (!transferRequest?.items) return;
        const next: Record<string, DeliveryLine> = {};
        for (const it of transferRequest.items) {
            const k = variantKey(it);
            if (k) next[k] = emptyDeliveryLine();
        }
        setDeliveryByVariant(next);
    };

    const buildSettlementItemsPayload = (targetStatus: string): object[] | null => {
        if (!transferRequest?.items?.length) return null;
        const out: object[] = [];
        for (const it of transferRequest.items) {
            const k = variantKey(it);
            if (!k) return null;
            const line = deliveryByVariant[k] ?? emptyDeliveryLine();
            const fields = [
                line.receivedQuantity,
                line.acceptedQuantity,
                line.damagedQuantity,
                line.missingQuantity,
                line.extraQuantity,
            ];

            if (fields.some((v) => v === "")) {
                setError(`SKU ${it.variant?.sku || k}: fill all quantity fields`);
                return null;
            }

            const receivedQuantity = Number(line.receivedQuantity);
            const acceptedQuantity = Number(line.acceptedQuantity);
            const damagedQuantity = Number(line.damagedQuantity);
            const missingQuantity = Number(line.missingQuantity);
            const extraQuantity = Number(line.extraQuantity);

            const numericValues = [
                receivedQuantity,
                acceptedQuantity,
                damagedQuantity,
                missingQuantity,
                extraQuantity,
            ];
            if (numericValues.some((n) => !Number.isInteger(n) || n < 0)) {
                setError(`SKU ${it.variant?.sku || k}: quantities must be non-negative integers`);
                return null;
            }

            if (receivedQuantity !== acceptedQuantity + damagedQuantity) {
                setError(
                    `SKU ${it.variant?.sku || k}: received must equal accepted + damaged`
                );
                return null;
            }

            const sentQuantity = Number(it.quantity) || 0;
            if (receivedQuantity !== sentQuantity - missingQuantity + extraQuantity) {
                setError(
                    `SKU ${it.variant?.sku || k}: received must equal sent - missing + extra`
                );
                return null;
            }

            if (
                targetStatus === "completed" &&
                !(receivedQuantity === sentQuantity &&
                    acceptedQuantity === sentQuantity &&
                    damagedQuantity === 0 &&
                    missingQuantity === 0 &&
                    extraQuantity === 0)
            ) {
                setError(
                    `SKU ${it.variant?.sku || k}: completed requires sent = received = accepted and no damaged/missing/extra`
                );
                return null;
            }
            out.push({
                variant: k,
                receivedQuantity,
                acceptedQuantity,
                damagedQuantity,
                missingQuantity,
                extraQuantity,
            });
        }
        return out;
    };

    const updateStatus = async () => {
        if (!transferRequest?._id || !selectedStatus || !warehouse?._id) return;
        setStatusUpdating(true);
        setError(null);

        let itemsPayload: object[] | undefined;
        if (needsSettlement(selectedStatus)) {
            const built = buildSettlementItemsPayload(selectedStatus);
            if (!built) {
                setStatusUpdating(false);
                return;
            }
            itemsPayload = built;
        }

        try {
            const response = await axios.patch(
                API_ENDPOINTS.UPDATE_INVENTORY_TRANSFER_STATUS,
                {
                    transferId: transferRequest._id,
                    status: selectedStatus,
                    changedByType: "warehouse",
                    changedById: warehouse._id,
                    ...(itemsPayload ? { items: itemsPayload } : {}),
                },
                { withCredentials: true }
            );

            if (response.data.success) {
                await fetchTransferRequest();
                onStatusUpdated?.();
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || err.message || "Failed to update transfer status");
            } else {
                setError("Failed to update transfer status");
            }
        } finally {
            setStatusUpdating(false);
        }
    };

    if (!isOpen) return null;

    const formatDate = (date?: string) => {
        if (!date) return "-";
        const parsed = new Date(date);
        if (Number.isNaN(parsed.getTime())) return "-";
        return parsed.toLocaleString();
    };

    const totalQuantity = transferRequest?.items?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) ?? 0;
    const hasActions = (transferRequest?.allowedStatuses?.length || 0) > 0;
    const isDeliveredStage = transferRequest?.status === "delivered";
    const showDeliveryForm =
        needsSettlement(selectedStatus) &&
        transferRequest?.status === "delivered";
    const showDeliveredActionChooser = isDeliveredStage && !forcedStatus;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
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

                {!loading && transferRequest && (
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

                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                            <p className="text-gray-500 dark:text-slate-400">Current Status</p>
                            <p className="font-medium capitalize text-gray-900 dark:text-white">{transferRequest.status}</p>
                            {!hasActions && (
                                <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
                                    No status actions available at this stage.
                                </p>
                            )}
                            {isDeliveredStage ? (
                                <div className="mt-3 space-y-3">
                                    {showDeliveredActionChooser && (
                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                            <button
                                                type="button"
                                                disabled={statusUpdating}
                                                onClick={() => setSelectedStatus("completed")}
                                                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                                                    selectedStatus === "completed"
                                                        ? "border-emerald-500 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                                                        : "border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                                                }`}
                                            >
                                                Completed
                                            </button>
                                            <button
                                                type="button"
                                                disabled={statusUpdating}
                                                onClick={() => setSelectedStatus("issue_reported")}
                                                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                                                    selectedStatus === "issue_reported"
                                                        ? "border-amber-500 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                                                        : "border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                                                }`}
                                            >
                                                Issue Reported
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        disabled={!hasActions || statusUpdating}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                                    >
                                        <option value="">Select next status</option>
                                        {(transferRequest.allowedStatuses || []).map((status) => (
                                            <option key={status} value={status}>
                                                {status}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={updateStatus}
                                        disabled={!hasActions || !selectedStatus || statusUpdating}
                                        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                                    >
                                        {statusUpdating ? "Updating..." : "Update Status"}
                                    </button>
                                </div>
                            )}
                            {showDeliveryForm && (
                                <div className="mt-4 space-y-3 rounded-lg border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                                            Settlement quantities (integers). Rule: received = accepted + damaged + missing + extra.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={resetDeliveryAllAccepted}
                                            className="text-xs font-medium text-amber-800 underline dark:text-amber-300"
                                        >
                                            Reset: all accepted, no issues
                                        </button>
                                    </div>
                                    <div className="max-h-56 space-y-2 overflow-y-auto">
                                        {transferRequest.items?.map((item) => {
                                            const k = variantKey(item);
                                            const line = deliveryByVariant[k] ?? emptyDeliveryLine();
                                            const sent = Number(item.quantity) || 0;
                                            return (
                                                <div
                                                    key={k}
                                                    className="grid grid-cols-2 gap-2 rounded border border-amber-100 bg-white/80 p-2 text-xs dark:border-amber-900/40 dark:bg-slate-900/50 sm:grid-cols-3 lg:grid-cols-6"
                                                >
                                                    <div className="col-span-2 font-medium text-gray-800 dark:text-slate-200 sm:col-span-3 lg:col-span-6">
                                                        SKU {item.variant?.sku || k}{" "}
                                                        <span className="font-normal text-gray-500">(sent {sent})</span>
                                                    </div>
                                                    {(
                                                        [
                                                            ["received", "receivedQuantity"],
                                                            ["accepted", "acceptedQuantity"],
                                                            ["damaged", "damagedQuantity"],
                                                            ["missing", "missingQuantity"],
                                                            ["extra", "extraQuantity"],
                                                        ] as const
                                                    ).map(([label, field]) => (
                                                        <label key={field} className="flex flex-col gap-0.5">
                                                            <span className="text-gray-500 dark:text-slate-400">{label}</span>
                                                            <input
                                                                type="number"
                                                                value={line[field]}
                                                                onChange={(e) =>
                                                                    setDeliveryField(k, field, e.target.value)
                                                                }
                                                                className="rounded border border-gray-300 px-1 py-1 dark:border-slate-600 dark:bg-slate-800"
                                                            />
                                                        </label>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex justify-end pt-1">
                                        <button
                                            type="button"
                                            onClick={updateStatus}
                                            disabled={statusUpdating || !selectedStatus}
                                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                                        >
                                            {statusUpdating
                                                ? "Submitting..."
                                                : `Submit ${selectedStatus === "completed" ? "Completed" : "Issue Reported"}`}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

export default TransferRequest;
