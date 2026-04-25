import { useState, useEffect } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "@/app/lib/api";
import { RootState } from "@/store";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { sellableAvailable } from "@/lib/inventoryDisplay";

type variant = {
  name?: string;
  sku?: string;
  images?: { url?: string }[];
};

type Inventory = {
  _id: string;
  quantity: number;
  reserved?: number;
  available?: number;
  missingHold?: number;
  damagedQty?: number;
  extraHold?: number;
  /** Populated from API as `{ _id, name, sku, images }` or raw ObjectId string */
  variant?: (variant & { _id?: string }) | string;
};

function getVariantIdFromInventory(inv: Inventory): string {
  const v = inv.variant;
  if (!v) return "";
  if (typeof v === "string") return v;
  return v._id != null ? String(v._id) : "";
}

function getVariantSku(inv: Inventory): string {
  const v = inv.variant;
  if (v && typeof v === "object" && "sku" in v) return v.sku ?? "—";
  return "—";
}

type TransferRow = {
  inventoryId: string;
  quantity: string;
};

type Warehouse = {
  _id: string;
  name: string;
  address: {
    formatted: string;
  }
};

const InventoryTransfer = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {

  const vendor = useSelector((state: RootState) => state.auth.vendor);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transferRows, setTransferRows] = useState<TransferRow[]>([{ inventoryId: "", quantity: "" }]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);



  const fetchWarehouses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(API_ENDPOINTS.GET_WAREHOUSES, {
        withCredentials: true,
      });
      if (response.data.success) {
        setWarehouses(response.data.warehouses ?? []);
      } else {
        setError(response.data.message ?? "Failed to fetch warehouses");
      }
    } catch (error: unknown) {
      console.error(error);
      setError(error instanceof Error ? error.message : "Failed to fetch warehouses");
    } finally {
      setLoading(false);
    }
  }

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!vendor?._id) {
        setError("Vendor not found");
        return;
      }

      const response = await axios.get(API_ENDPOINTS.INVENTORY_LIST, {
        params: { vendorId: vendor?._id },
        withCredentials: true,
      });

      if (response.data.success) {
        setInventory(response.data.inventory);
      }
    } catch (error: unknown) {
      console.error(error);
      setError(error instanceof Error ? error.message : "Failed to fetch inventory");
    }
    finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInventory();
    fetchWarehouses();
  }, []);

  const selectedInventoryIds = transferRows
    .map((row) => row.inventoryId)
    .filter((id) => id !== "");

  const selectedInventoryWithQuantity = transferRows
    .map((row, rowIndex) => {
      if (row.inventoryId === "") return null;
      const selectedInv = inventory.find((inv) => inv._id === row.inventoryId);
      if (!selectedInv) return null;
      return {
        rowIndex,
        inventory: selectedInv,
        quantity: row.quantity === "" ? 0 : Number(row.quantity),
      };
    })
    .filter((item): item is { rowIndex: number; inventory: Inventory; quantity: number } => item !== null);

  const handleInventoryChange = (index: number, inventoryId: string) => {
    setTransferRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        if (!inventoryId) return { inventoryId: "", quantity: "" };

        const selectedInv = inventory.find((inv) => inv._id === inventoryId);
        if (!selectedInv) return { ...row, inventoryId };

        if (row.quantity === "") return { ...row, inventoryId };

        const parsedQty = Number(row.quantity);
        const maxSellable = sellableAvailable(selectedInv);
        if (maxSellable <= 0) return { ...row, inventoryId, quantity: "" };
        const clampedQty = Math.min(Math.max(parsedQty, 1), maxSellable);
        return { inventoryId, quantity: String(clampedQty) };
      })
    );
  };

  const handleQuantityChange = (index: number, quantityValue: string) => {
    setTransferRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        if (quantityValue === "") return { ...row, quantity: "" };

        const parsedQty = Number(quantityValue);
        if (Number.isNaN(parsedQty)) return row;

        const selectedInv = inventory.find((inv) => inv._id === row.inventoryId);
        const maxQty = selectedInv ? sellableAvailable(selectedInv) : Number.MAX_SAFE_INTEGER;
        if (maxQty <= 0) return { ...row, quantity: "" };
        const clampedQty = Math.min(Math.max(parsedQty, 1), maxQty);
        return { ...row, quantity: String(clampedQty) };
      })
    );
  };

  const handleAddInventoryRow = () => {
    setTransferRows((prev) => [...prev, { inventoryId: "", quantity: "" }]);
  };

  const handleRemoveInventoryRow = (index: number) => {
    setTransferRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!vendor?._id) {
      toast.error("Vendor not found");
      return;
    }
    if (!selectedWarehouse?._id) {
      toast.error("Select a warehouse");
      return;
    }

    const variantsData = selectedInventoryWithQuantity
      .map((item) => ({
        variantId: getVariantIdFromInventory(item.inventory),
        quantity: Math.floor(Number(item.quantity)),
      }))
      .filter((row) => row.variantId && row.quantity > 0);

    if (variantsData.length === 0) {
      toast.error("Add at least one line with inventory and quantity");
      return;
    }

    const totalQuantity = variantsData.reduce((sum, row) => sum + row.quantity, 0);

    try {
      const response = await axios.post(
        API_ENDPOINTS.CREATE_INVENTORY_TRANSFER,
        {
          variantsData,
          totalQuantity,
          fromType: "vendor",
          fromId: vendor._id,
          toType: "warehouse",
          toId: selectedWarehouse._id,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success(response.data.message ?? "Transfer created");
        onClose();
        fetchInventory();
        setTransferRows([{ inventoryId: "", quantity: "" }]);
        setSelectedWarehouse(null);
      } else {
        toast.error(response.data.message ?? "Transfer failed");
      }
    } catch {
      toast.error("Failed to submit transfer");
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="text-lg text-red-600 dark:text-red-400">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center px-4 py-6 ${isOpen ? "block" : "hidden"}`}>
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700/70 bg-slate-900/95 p-5 md:p-7 space-y-6 shadow-[0_24px_64px_rgba(0,0,0,0.55)] text-slate-100">
        <div className="flex items-start justify-between gap-4 border-b border-slate-700/70 pb-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Inventory Transfer</h2>
            <p className="text-sm text-slate-400 mt-1">Pick unique inventory items and define quantity per row.</p>
          </div>
          <button
            className="text-xs font-medium px-3 py-1.5 rounded-md border border-slate-600 bg-slate-800 hover:bg-slate-700 transition-colors"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="space-y-3.5">
          {transferRows.map((row, i) => {
            const availableInventory = inventory.filter(
              (inv) =>
                (inv._id === row.inventoryId || !selectedInventoryIds.includes(inv._id)) &&
                (sellableAvailable(inv) > 0 || inv._id === row.inventoryId)
            );
            const selectedInv = inventory.find((inv) => inv._id === row.inventoryId);
            const maxSellable = selectedInv ? sellableAvailable(selectedInv) : 0;

            return (
              <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-3.5 rounded-xl p-4 border border-slate-700/80 bg-slate-800/80">
                <div className="md:col-span-7">
                  <label className="text-[11px] uppercase tracking-wide font-semibold text-slate-400 mb-1.5 block">Inventory</label>
                  <select
                    className="w-full h-10 rounded-lg border border-slate-600 bg-slate-900 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                    value={row.inventoryId}
                    onChange={(e) => handleInventoryChange(i, e.target.value)}
                  >
                    <option value="">Select inventory</option>
                    {availableInventory.map((inv) => (
                      <option key={inv._id} value={inv._id}>
                        {getVariantSku(inv)} (avail: {sellableAvailable(inv)}, total: {inv.quantity})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="text-[11px] uppercase tracking-wide font-semibold text-slate-400 mb-1.5 block">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    max={maxSellable > 0 ? maxSellable : undefined}
                    disabled={!row.inventoryId || maxSellable <= 0}
                    className="w-full h-10 rounded-lg border border-slate-600 bg-slate-900 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                    placeholder="0"
                    value={row.quantity}
                    onChange={(e) => handleQuantityChange(i, e.target.value)}
                  />
                  {selectedInv && (
                    <p className="text-xs text-slate-400 mt-1.5">
                      Max (sellable): {maxSellable} · Total on-hand: {selectedInv.quantity}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2 flex items-end">
                  <button
                    type="button"
                    className="w-full h-10 rounded-lg px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={transferRows.length === 1}
                    onClick={() => handleRemoveInventoryRow(i)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>


        <div className="flex justify-start">
          <button
            type="button"
            className="h-10 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 rounded-lg transition-colors"
            onClick={handleAddInventoryRow}
          >
            Add Inventory
          </button>
        </div>

        <div className="flex justify-start gap-3">
          <label className="text-[11px] uppercase tracking-wide font-semibold text-slate-400 mb-1.5 block">Warehouse</label>
          <select
            className="w-full h-10 rounded-lg border border-slate-600 bg-slate-900 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
            value={selectedWarehouse?._id ?? ""}
            onChange={(e) => setSelectedWarehouse(warehouses.find((warehouse) => warehouse._id === e.target.value) ?? null)}
          >
            <option value="">Select warehouse</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse._id} value={warehouse._id}>
                {warehouse.name} - {warehouse.address.formatted}
              </option>
            ))}
          </select>
        </div>

        <div className="border-t border-slate-700/70 pt-5">
          <h3 className="font-semibold text-base mb-3">Selected Inventory</h3>
          {selectedInventoryWithQuantity.length === 0 ? (
            <p className="text-sm text-slate-400">No inventory selected yet.</p>
          ) : (
            <div className="space-y-2.5">
              {selectedInventoryWithQuantity.map((item) => (
                <div
                  key={`${item.inventory._id}-${item.rowIndex}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2.5"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-100">{getVariantSku(item.inventory)}</span>
                    <span className="text-xs text-slate-400">Qty: {item.quantity || 0}</span>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-medium px-2.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                    onClick={() => handleRemoveInventoryRow(item.rowIndex)}
                  >
                    Remove
                  </button>
                </div>
              ))}

              <form onSubmit={handleSubmit}>
                <button
                  type="submit"
                  className="w-full h-10 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 rounded-lg transition-colors"
                >
                  Submit
                </button>
              </form>


            </div>


          )}
        </div>
      </div>
    </div>
  )

};

export default InventoryTransfer;