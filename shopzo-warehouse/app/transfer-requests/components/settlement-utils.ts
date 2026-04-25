import type { SettlementRow } from "./IssueSettlementForm";

export type SettlementValidationResult = {
  ok: boolean;
  message?: string;
  invalidFields?: string[];
  invalidRows?: number[];
};

export const validateSettlement = (
  rows: SettlementRow[],
  skus: string[],
  selectedStatus: string,
  showSettlementForm: boolean,
  isCompletedMode: boolean
): SettlementValidationResult => {
  if (!showSettlementForm) return { ok: true };

  let hasDiscrepancy = false;

  for (let idx = 0; idx < rows.length; idx += 1) {
    const row = rows[idx];
    const sku = skus[idx] || `row ${idx + 1}`;
    const sent = Number(row.sentQuantity);

    const fields: Array<keyof Omit<SettlementRow, "variant" | "sentQuantity">> = [
      "receivedQuantity",
      "acceptedQuantity",
      "damagedQuantity",
      "missingQuantity",
      "extraQuantity",
    ];

    for (const field of fields) {
      if (row[field] === "") {
        return {
          ok: false,
          message: `Fill all quantities for ${sku}`,
          invalidFields: [`${idx}:${field}`],
          invalidRows: [idx],
        };
      }
      const n = Number(row[field]);
      if (!Number.isInteger(n) || n < 0) {
        return {
          ok: false,
          message: `Use non-negative whole numbers for ${sku}`,
          invalidFields: [`${idx}:${field}`],
          invalidRows: [idx],
        };
      }
    }

    const received = Number(row.receivedQuantity);
    const accepted = Number(row.acceptedQuantity);
    const damaged = Number(row.damagedQuantity);
    const missing = Number(row.missingQuantity);
    const extra = Number(row.extraQuantity);
    const allowDamaged = received > accepted;
    const allowMissing = sent > received;
    const allowExtra = received > sent;
    const mismatch = allowDamaged || allowMissing || allowExtra;

    if (!isCompletedMode && selectedStatus === "issue_reported") {
      // If no mismatch exists for this row, this row should not need issue details.
      if (!mismatch) {
        continue;
      }

      if (row.issueType === "none") {
        return {
          ok: false,
          message: `${sku}: select issue type`,
          invalidFields: [`${idx}:issueType`],
          invalidRows: [idx],
        };
      }

      if (row.issueType === "damaged" && damaged <= 0) {
        return {
          ok: false,
          message: `${sku}: choose damaged quantity`,
          invalidFields: [`${idx}:damagedQuantity`],
          invalidRows: [idx],
        };
      }
      if (row.issueType === "missing" && missing <= 0) {
        return {
          ok: false,
          message: `${sku}: choose missing quantity`,
          invalidFields: [`${idx}:missingQuantity`],
          invalidRows: [idx],
        };
      }
      if (row.issueType === "extra" && extra <= 0) {
        return {
          ok: false,
          message: `${sku}: choose extra quantity`,
          invalidFields: [`${idx}:extraQuantity`],
          invalidRows: [idx],
        };
      }

      if (row.issueType === "mix") {
        const selectedMixTypes = Number(row.mixDamaged) + Number(row.mixMissing) + Number(row.mixExtra);
        if (selectedMixTypes < 2) {
          return {
            ok: false,
            message: `${sku}: choose at least 2 issue types for mix`,
            invalidFields: [`${idx}:issueType`],
            invalidRows: [idx],
          };
        }
      }

      if ((row.issueType === "damaged" || (row.issueType === "mix" && row.mixDamaged)) && damaged > 0) {
        if (!row.damagedImages || row.damagedImages.length === 0) {
          return {
            ok: false,
            message: `${sku}: damaged images are required`,
            invalidFields: [`${idx}:damagedImages`],
            invalidRows: [idx],
          };
        }
      }
    }

    if (received !== accepted + damaged) {
      return {
        ok: false,
        message: `${sku}: received must equal accepted + damaged`,
        invalidFields: [
          `${idx}:receivedQuantity`,
          `${idx}:acceptedQuantity`,
          `${idx}:damagedQuantity`,
        ],
        invalidRows: [idx],
      };
    }

    if (received !== sent - missing + extra) {
      return {
        ok: false,
        message: `${sku}: received must equal sent - missing + extra`,
        invalidFields: [
          `${idx}:receivedQuantity`,
          `${idx}:missingQuantity`,
          `${idx}:extraQuantity`,
        ],
        invalidRows: [idx],
      };
    }

    if (
      received !== sent ||
      accepted !== sent ||
      damaged !== 0 ||
      missing !== 0 ||
      extra !== 0
    ) {
      hasDiscrepancy = true;
    }

    if (isCompletedMode) {
      const strictCompleted =
        received === sent &&
        accepted === sent &&
        damaged === 0 &&
        missing === 0 &&
        extra === 0;
      if (!strictCompleted) {
        return {
          ok: false,
          message: `${sku}: completed requires perfect match with no discrepancy`,
          invalidFields: [
            `${idx}:receivedQuantity`,
            `${idx}:acceptedQuantity`,
            `${idx}:damagedQuantity`,
            `${idx}:missingQuantity`,
            `${idx}:extraQuantity`,
          ],
          invalidRows: [idx],
        };
      }
    }
  }

  if (selectedStatus === "issue_reported" && !hasDiscrepancy) {
    return {
      ok: false,
      message: "No discrepancy found. Use completed for perfect settlement.",
      invalidRows: rows.map((_, i) => i),
    };
  }

  return { ok: true };
};

export const buildSettlementPayload = (rows: SettlementRow[]) =>
  rows.map((row) => ({
    variant: row.variant,
    receivedQuantity: Number(row.receivedQuantity || 0),
    acceptedQuantity: Number(row.acceptedQuantity || 0),
    damagedQuantity: Number(row.damagedQuantity || 0),
    missingQuantity: Number(row.missingQuantity || 0),
    extraQuantity: Number(row.extraQuantity || 0),
    issueImages: row.damagedImages || [],
  }));
