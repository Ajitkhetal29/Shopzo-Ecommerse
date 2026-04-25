/** Mirrors backend: available = quantity - reserved - missingHold - damagedQty - extraHold */
export type InventoryStockFields = {
  quantity?: number;
  reserved?: number;
  available?: number;
  missingHold?: number;
  damagedQty?: number;
  extraHold?: number;
};

export function sellableAvailable(inv: InventoryStockFields): number {
  if (typeof inv.available === "number" && !Number.isNaN(inv.available)) {
    return Math.max(0, inv.available);
  }
  const q = Number(inv.quantity ?? 0);
  const r = Number(inv.reserved ?? 0);
  const mh = Number(inv.missingHold ?? 0);
  const dq = Number(inv.damagedQty ?? 0);
  const eh = Number(inv.extraHold ?? 0);
  return Math.max(0, q - r - mh - dq - eh);
}
