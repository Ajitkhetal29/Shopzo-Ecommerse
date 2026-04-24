"use client";

type TransferVariant = {
  _id: string;
  sku?: string;
};

type TransferItem = {
  variant: TransferVariant;
  quantity: number;
};

export type SettlementRow = {
  variant: string;
  sentQuantity: number;
  receivedQuantity: string;
  acceptedQuantity: string;
  damagedQuantity: string;
  missingQuantity: string;
  extraQuantity: string;
  issueType: "none" | "damaged" | "missing" | "extra" | "mix";
  mixDamaged: boolean;
  mixMissing: boolean;
  mixExtra: boolean;
  damagedImages: string[];
};

export type SettlementField =
  | "receivedQuantity"
  | "acceptedQuantity"
  | "damagedQuantity"
  | "missingQuantity"
  | "extraQuantity"
  | "issueType"
  | "damagedImages";

type IssueSettlementFormProps = {
  show: boolean;
  rows: SettlementRow[];
  transferItems: TransferItem[];
  isCompletedMode: boolean;
  error: string | null;
  invalidFieldKeys: string[];
  invalidRowIndexes: number[];
  onChangeRow: (index: number, patch: Partial<SettlementRow>) => void;
};

const IssueSettlementForm = ({
  show,
  rows,
  transferItems,
  isCompletedMode,
  error,
  invalidFieldKeys,
  invalidRowIndexes,
  onChangeRow,
}: IssueSettlementFormProps) => {
  if (!show) return null;

  const intRange = (start: number, end: number) => {
    const values: number[] = [];
    for (let n = start; n <= end; n += 1) values.push(n);
    return values;
  };

  const parseNum = (value: string) => {
    const n = Number(value);
    return Number.isInteger(n) && n >= 0 ? n : 0;
  };

  const getCandidates = (sent: number, received: number, accepted: number) => {
    const allowDamaged = received > accepted;
    const allowMissing = sent > received;
    const allowExtra = received > sent;
    const mismatch = allowDamaged || allowMissing || allowExtra;
    const mismatchTypeCount =
      Number(allowDamaged) + Number(allowMissing) + Number(allowExtra);
    return { allowDamaged, allowMissing, allowExtra, mismatch, mismatchTypeCount };
  };

  const cls = (idx: number, field: SettlementField, width = "w-20") =>
    `${width} rounded border px-2 py-1 text-sm dark:bg-slate-900 dark:text-slate-100 ${
      invalidFieldKeys.includes(`${idx}:${field}`)
        ? "border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-900/20"
        : "border-gray-300 dark:border-slate-600"
    }`;

  const replaceImagePreviews = (idx: number, files: FileList | null) => {
    const current = rows[idx]?.damagedImages || [];
    current.forEach((url) => {
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    });
    const previews = files ? Array.from(files).map((f) => URL.createObjectURL(f)) : [];
    onChangeRow(idx, { damagedImages: previews });
  };

  const renderQtySelect = (
    idx: number,
    field: "damagedQuantity" | "missingQuantity" | "extraQuantity",
    value: string,
    max: number
  ) => (
    <select
      className={cls(idx, field, "w-24")}
      value={value}
      onChange={(e) => onChangeRow(idx, { [field]: e.target.value } as Partial<SettlementRow>)}
    >
      <option value="0">Qty</option>
      {intRange(1, Math.max(1, max)).map((n) => (
        <option key={n} value={String(n)}>
          {n}
        </option>
      ))}
    </select>
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800">
      {error && (
        <div className="mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}
      <p className="mb-3 text-xs text-gray-500 dark:text-slate-400">
        Fill received + accepted first. Issue options appear only when mismatch exists.
      </p>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-slate-300">
              <th className="px-3 py-3">SKU</th>
              <th className="px-3 py-3">Sent</th>
              <th className="px-3 py-3">Received</th>
              <th className="px-3 py-3">Accepted</th>
              <th className="px-3 py-3">Issue Type</th>
              <th className="px-3 py-3">Issue Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
            {rows.map((row, idx) => {
              const sku = transferItems[idx]?.variant?.sku || "-";
              const sent = Number(row.sentQuantity) || 0;
              const received = parseNum(row.receivedQuantity);
              const accepted = parseNum(row.acceptedQuantity);
              const { allowDamaged, allowMissing, allowExtra, mismatch, mismatchTypeCount } =
                getCandidates(sent, received, accepted);

              return (
                <tr
                  key={`${row.variant}-${idx}`}
                  className={invalidRowIndexes.includes(idx) ? "bg-red-50/70 dark:bg-red-900/10" : ""}
                >
                  <td className="px-3 py-3 text-sm text-gray-700 dark:text-slate-300">{sku}</td>
                  <td className="px-3 py-3 text-sm font-medium text-gray-900 dark:text-white">{sent}</td>
                  <td className="px-3 py-3">
                    <input
                      type="number"
                      className={cls(idx, "receivedQuantity")}
                      value={row.receivedQuantity}
                      disabled={isCompletedMode}
                      onChange={(e) => onChangeRow(idx, { receivedQuantity: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <input
                      type="number"
                      className={cls(idx, "acceptedQuantity")}
                      value={row.acceptedQuantity}
                      disabled={isCompletedMode}
                      onChange={(e) => onChangeRow(idx, { acceptedQuantity: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-3">
                    {!mismatch || isCompletedMode ? (
                      <span className="text-xs text-gray-500 dark:text-slate-400">No issue</span>
                    ) : (
                      <select
                        className={cls(idx, "issueType", "w-28")}
                        value={row.issueType}
                        onChange={(e) => {
                          const issueType = e.target.value as SettlementRow["issueType"];
                          onChangeRow(idx, {
                            issueType,
                            mixDamaged: false,
                            mixMissing: false,
                            mixExtra: false,
                            damagedQuantity: "0",
                            missingQuantity: "0",
                            extraQuantity: "0",
                            damagedImages: [],
                          });
                        }}
                      >
                        <option value="none">Select</option>
                        {allowDamaged && <option value="damaged">Damaged</option>}
                        {allowMissing && <option value="missing">Missing</option>}
                        {allowExtra && <option value="extra">Extra</option>}
                        {mismatchTypeCount > 1 && <option value="mix">Mix</option>}
                      </select>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-2 text-xs text-gray-600 dark:text-slate-300">
                      {row.issueType === "damaged" && allowDamaged && !isCompletedMode && (
                        <div className="flex flex-wrap items-center gap-2 rounded-md border border-gray-200 p-2 dark:border-slate-700">
                          <span className="w-16 font-medium text-gray-700 dark:text-slate-200">Damaged</span>
                          {renderQtySelect(
                            idx,
                            "damagedQuantity",
                            row.damagedQuantity,
                            Math.max(1, received - accepted)
                          )}
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className={cls(idx, "damagedImages", "w-44")}
                            onChange={(e) => replaceImagePreviews(idx, e.target.files)}
                          />
                        </div>
                      )}

                      {row.issueType === "missing" && allowMissing && !isCompletedMode && (
                        <div className="flex flex-wrap items-center gap-2 rounded-md border border-gray-200 p-2 dark:border-slate-700">
                          <span className="w-16 font-medium text-gray-700 dark:text-slate-200">Missing</span>
                          {renderQtySelect(idx, "missingQuantity", row.missingQuantity, Math.max(1, sent - received))}
                        </div>
                      )}

                      {row.issueType === "extra" && allowExtra && !isCompletedMode && (
                        <div className="flex flex-wrap items-center gap-2 rounded-md border border-gray-200 p-2 dark:border-slate-700">
                          <span className="w-16 font-medium text-gray-700 dark:text-slate-200">Extra</span>
                          {renderQtySelect(idx, "extraQuantity", row.extraQuantity, Math.max(1, received - sent))}
                        </div>
                      )}

                      {row.issueType === "mix" && mismatchTypeCount > 1 && !isCompletedMode && (
                        <div className="space-y-2">
                          <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-slate-400">
                            Select issue types and quantities
                          </div>
                          {allowDamaged && (
                            <div className="rounded-md border border-gray-200 p-2 dark:border-slate-700">
                              <label className="mb-2 flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={row.mixDamaged}
                                  onChange={(e) =>
                                    onChangeRow(idx, {
                                      mixDamaged: e.target.checked,
                                      damagedQuantity: e.target.checked ? (row.damagedQuantity || "1") : "0",
                                      damagedImages: e.target.checked ? row.damagedImages : [],
                                    })
                                  }
                                />
                                <span className="font-medium">Damaged</span>
                              </label>
                              {row.mixDamaged && (
                                <div className="flex flex-wrap items-center gap-2">
                                  {renderQtySelect(
                                    idx,
                                    "damagedQuantity",
                                    row.damagedQuantity,
                                    Math.max(1, received - accepted)
                                  )}
                                  <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className={cls(idx, "damagedImages", "w-44")}
                                    onChange={(e) => replaceImagePreviews(idx, e.target.files)}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                          {allowMissing && (
                            <div className="rounded-md border border-gray-200 p-2 dark:border-slate-700">
                              <label className="mb-2 flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={row.mixMissing}
                                  onChange={(e) =>
                                    onChangeRow(idx, {
                                      mixMissing: e.target.checked,
                                      missingQuantity: e.target.checked ? (row.missingQuantity || "1") : "0",
                                    })
                                  }
                                />
                                <span className="font-medium">Missing</span>
                              </label>
                              {row.mixMissing && (
                                <div className="flex flex-wrap items-center gap-2">
                                  {renderQtySelect(
                                    idx,
                                    "missingQuantity",
                                    row.missingQuantity,
                                    Math.max(1, sent - received)
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          {allowExtra && (
                            <div className="rounded-md border border-gray-200 p-2 dark:border-slate-700">
                              <label className="mb-2 flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={row.mixExtra}
                                  onChange={(e) =>
                                    onChangeRow(idx, {
                                      mixExtra: e.target.checked,
                                      extraQuantity: e.target.checked ? (row.extraQuantity || "1") : "0",
                                    })
                                  }
                                />
                                <span className="font-medium">Extra</span>
                              </label>
                              {row.mixExtra && (
                                <div className="flex flex-wrap items-center gap-2">
                                  {renderQtySelect(
                                    idx,
                                    "extraQuantity",
                                    row.extraQuantity,
                                    Math.max(1, received - sent)
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          {(row.issueType === "mix" && row.mixDamaged && row.damagedImages.length > 0) && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {row.damagedImages.map((url) => (
                                <img
                                  key={url}
                                  src={url}
                                  alt="Damaged preview"
                                  className="h-10 w-10 rounded border border-gray-300 object-cover dark:border-slate-600"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IssueSettlementForm;
