"use client";

import { API_ENDPOINTS } from "@/lib/api";
import { RootState } from "@/store";
import axios from "axios";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import IssueSettlementForm, {
  SettlementField,
  SettlementRow,
} from "../../components/IssueSettlementForm";
import { buildSettlementPayload, validateSettlement } from "../../components/settlement-utils";

type TransferVariant = { _id: string; sku?: string };
type TransferParty = { _id: string; name: string };
type TransferItem = { variant: TransferVariant; quantity: number };
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

const SettlementPage = () => {
  const params = useParams<{ id: string }>();
  const transferId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const searchParams = useSearchParams();
  const router = useRouter();
  const warehouse = useSelector((state: RootState) => state.auth.warehouse);

  const mode = useMemo(() => {
    const raw = searchParams.get("mode");
    return raw === "completed" || raw === "issue_reported" ? raw : "issue_reported";
  }, [searchParams]);

  const isCompletedMode = mode === "completed";

  const [transfer, setTransfer] = useState<TransferRequestDetail | null>(null);
  const [rows, setRows] = useState<SettlementRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settlementError, setSettlementError] = useState<string | null>(null);
  const [invalidFieldKeys, setInvalidFieldKeys] = useState<string[]>([]);
  const [invalidRowIndexes, setInvalidRowIndexes] = useState<number[]>([]);

  useEffect(() => {
    if (!transferId) return;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(API_ENDPOINTS.GET_INVENTORY_TRANSFER_REQUEST_BY_ID, {
          withCredentials: true,
          params: { id: transferId },
        });
        if (!res.data.success) {
          setError(res.data.message || "Failed to load transfer");
          return;
        }
        const doc = res.data.transfer as TransferRequestDetail;
        setTransfer(doc);
        const initialRows: SettlementRow[] = (doc.items || []).map((item) => ({
          variant: String(item.variant?._id || ""),
          sentQuantity: Number(item.quantity) || 0,
          receivedQuantity: "",
          acceptedQuantity: "",
          damagedQuantity: "0",
          missingQuantity: "0",
          extraQuantity: "0",
          issueType: "none",
          mixDamaged: false,
          mixMissing: false,
          mixExtra: false,
          damagedImages: [],
        }));

        if (isCompletedMode) {
          initialRows.forEach((row) => {
            row.receivedQuantity = String(row.sentQuantity);
            row.acceptedQuantity = String(row.sentQuantity);
          });
        }
        setRows(initialRows);
      } catch (e: unknown) {
        if (axios.isAxiosError(e)) setError(e.response?.data?.message || e.message);
        else setError("Failed to load transfer");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [transferId, isCompletedMode]);

  const updateSettlementRow = (index: number, field: SettlementField, value: string) => {
    if (isCompletedMode) return;
    setSettlementError(null);
    setInvalidFieldKeys((prev) => prev.filter((key) => key !== `${index}:${field}`));
    setInvalidRowIndexes((prev) => prev.filter((rowIdx) => rowIdx !== index));
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const sanitizeRowForMismatch = (row: SettlementRow): SettlementRow => {
    const sent = Number(row.sentQuantity) || 0;
    const received = Number(row.receivedQuantity || 0);
    const accepted = Number(row.acceptedQuantity || 0);
    const mismatch = received > accepted || sent > received || received > sent;
    if (mismatch) return row;

    return {
      ...row,
      issueType: "none",
      mixDamaged: false,
      mixMissing: false,
      mixExtra: false,
      damagedQuantity: "0",
      missingQuantity: "0",
      extraQuantity: "0",
      damagedImages: [],
    };
  };

  const handleSubmit = async () => {
    if (!transfer?._id || !warehouse?._id) return;
    const validation = validateSettlement(
      rows,
      transfer.items.map((i) => i.variant?.sku || "-"),
      mode,
      true,
      isCompletedMode
    );
    if (!validation.ok) {
      setSettlementError(validation.message || "Settlement validation failed");
      setInvalidFieldKeys(validation.invalidFields || []);
      setInvalidRowIndexes(validation.invalidRows || []);
      return;
    }

    setSubmitting(true);
    try {
      const endpoint =
        mode === "completed"
          ? API_ENDPOINTS.COMPLETE_INVENTORY_TRANSFER
          : API_ENDPOINTS.ISSUE_REPORT_INVENTORY_TRANSFER;
      const payload =
        mode === "completed"
          ? {
              transferId: transfer._id,
              userType: "warehouse",
              userId: warehouse._id,
            }
          : {
              transferId: transfer._id,
              userType: "warehouse",
              userId: warehouse._id,
              items: buildSettlementPayload(rows),
            };

      const res = await axios.patch(endpoint, payload, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message || "Settlement submitted");
        router.push("/transfer-requests");
      } else {
        toast.error(res.data.message || "Failed to submit settlement");
      }
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) toast.error(e.response?.data?.message || e.message);
      else toast.error("Failed to submit settlement");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading settlement...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!transfer) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl space-y-4">
        <Link href="/transfer-requests" className="text-sm underline">
          Back to transfer requests
        </Link>

        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <h1 className="text-xl font-semibold">{isCompletedMode ? "Complete Transfer" : "Report Issues"}</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Transfer #{transfer._id} - status: {transfer.status}
          </p>
        </div>

        <IssueSettlementForm
          show={true}
          rows={rows}
          transferItems={transfer.items}
          isCompletedMode={isCompletedMode}
          error={settlementError}
          invalidFieldKeys={invalidFieldKeys}
          invalidRowIndexes={invalidRowIndexes}
          onChangeRow={(index, patch) => {
            for (const [field, value] of Object.entries(patch)) {
              if (
                field === "receivedQuantity" ||
                field === "acceptedQuantity" ||
                field === "damagedQuantity" ||
                field === "missingQuantity" ||
                field === "extraQuantity" ||
                field === "issueType"
              ) {
                updateSettlementRow(index, field as SettlementField, String(value ?? ""));
              }
            }
            setRows((prev) =>
              prev.map((row, i) => (i === index ? sanitizeRowForMismatch({ ...row, ...patch }) : row))
            );
          }}
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => router.push("/transfer-requests")}
            className="rounded-md border px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-60 dark:bg-white dark:text-black"
          >
            {submitting ? "Submitting..." : isCompletedMode ? "Mark Completed" : "Submit Issues"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettlementPage;
