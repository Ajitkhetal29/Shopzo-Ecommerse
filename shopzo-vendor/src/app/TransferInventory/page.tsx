"use client";
import axios from "axios";
import { API_ENDPOINTS } from "../lib/api";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import TransferRequest from "./components/transferrequest";

type inventoryTransfer = {
    _id: string;
    fromType: string;
    fromName: string | null;
    toType: string;
    toName: string | null;
    status: string;
    initiatedAt: string;
};

type StatusTab = "all" | "active" | "completed" | "reject";

const PAGE_SIZE = 10;

const TransferInventoryPage = () => {

    const vendor = useSelector((state: RootState) => state.auth.vendor);
    const [inventoryTransferRequests, setInventoryTransferRequests] = useState<inventoryTransfer[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedStatusTab, setSelectedStatusTab] = useState<StatusTab>("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [activeTransferId, setActiveTransferId] = useState<string | null>(null);

    const vendorCanChangeStatus = (status: string) =>
        status === "initiated" || status === "approved";

    useEffect(() => {
        setPage(1);
    }, [vendor?._id]);

    const fetchInventoryTransferRequests = useCallback(async () => {
        if (!vendor?._id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(API_ENDPOINTS.GET_INVENTORY_TRANSFER_REQUESTS, {
                withCredentials: true,
                params: {
                    fromType: "vendor",
                    fromId: vendor?._id,
                    status: selectedStatusTab,
                    page,
                    limit: PAGE_SIZE,
                },
            });
            if (response.data.success) {
                setInventoryTransferRequests(response.data.transferRequests ?? []);
                setTotalPages(Math.max(1, Number(response.data.totalPages) || 1));
                setTotalCount(Number(response.data.totalCount) || 0);
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || err.message || "Failed to fetch inventory transfer requests");
            } else {
                setError("Failed to fetch inventory transfer requests");
            }
        } finally {
            setLoading(false);
        }
    }, [vendor?._id, selectedStatusTab, page]);

    useEffect(() => {
        fetchInventoryTransferRequests();
    }, [fetchInventoryTransferRequests]);

    const formatDate = (date?: string) => {
        if (!date) return "-";
        const parsed = new Date(date);
        if (Number.isNaN(parsed.getTime())) return "-";
        return parsed.toLocaleString();
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
                <div className="text-lg text-gray-600 dark:text-gray-400">Loading transfer requests...</div>
            </div>
        );
    }
    if (error) {
        return (
            <div className="p-4 bg-gray-50 dark:bg-slate-900 min-h-screen">
                <div className="max-w-7xl mx-auto bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded">
                    Error: {error}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Transfer Inventory</h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Track all your transfer requests</p>
                </div>

            <div className="mb-6 flex items-center gap-2 overflow-x-auto">
                {(["all", "active", "completed", "reject"] as StatusTab[]).map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => {
                            setSelectedStatusTab(tab);
                            setPage(1);
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                            selectedStatusTab === tab
                                ? "bg-black dark:bg-white text-white dark:text-black"
                                : "bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {inventoryTransferRequests.length === 0 && (
                <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-12 text-center text-gray-600 dark:text-gray-300">
                    No inventory transfer requests found
                </div>
            )}

            {inventoryTransferRequests.length > 0 && (
                <div className="flex flex-col gap-4 w-full">
                    {inventoryTransferRequests.map((request) => {
                        return (
                        <div
                            key={request._id}
                            className="w-full rounded-xl p-5 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                    Initiated: <span className="text-gray-700 dark:text-gray-200 font-medium">{formatDate(request.initiatedAt)}</span>
                                </p>
                                <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize `}>
                                    {request.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-3 bg-gray-50 dark:bg-slate-900/30">
                                    <p className="text-gray-500 dark:text-gray-400">From Type</p>
                                    <p className="font-semibold text-gray-900 dark:text-slate-100 capitalize">{request.fromType}</p>
                                    <p className="mt-1 text-gray-700 dark:text-gray-300">{request.fromName || "-"}</p>
                                </div>
                                <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-3 bg-gray-50 dark:bg-slate-900/30">
                                    <p className="text-gray-500 dark:text-gray-400">To Type</p>
                                    <p className="font-semibold text-gray-900 dark:text-slate-100 capitalize">{request.toType}</p>
                                    <p className="mt-1 text-gray-700 dark:text-gray-300">{request.toName || "-"}</p>
                                </div>
                            </div>

                            <div className="mt-4 flex justify-end gap-2">
                                {vendorCanChangeStatus(request.status) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveTransferId(request._id);
                                            setStatusModalOpen(true);
                                        }}
                                        className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 dark:bg-white dark:text-black"
                                    >
                                        Change status
                                    </button>
                                )}
                                <Link
                                    href={`/TransferInventory/${request._id}`}
                                    className="rounded-lg border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    View Details
                                </Link>
                            </div>
                        </div>
                        );
                    })}
                </div>
            )}

            <TransferRequest
                isOpen={statusModalOpen}
                transferId={activeTransferId}
                onClose={() => {
                    setStatusModalOpen(false);
                    setActiveTransferId(null);
                }}
                onSuccess={() => {
                    fetchInventoryTransferRequests();
                }}
            />

            {totalCount > 0 && (
                <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-gray-200 dark:border-slate-700 pt-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Showing page <span className="font-medium text-gray-900 dark:text-slate-100">{page}</span> of{" "}
                        <span className="font-medium text-gray-900 dark:text-slate-100">{totalPages}</span>
                        <span className="text-gray-500 dark:text-gray-500"> · {totalCount} total</span>
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="rounded-lg border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            className="rounded-lg border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
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

export default TransferInventoryPage;