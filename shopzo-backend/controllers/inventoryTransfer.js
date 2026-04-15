import mongoose from "mongoose";
import Inventory from "../models/inventory.js";
import inventoryTransfer from "../models/inventoryTransfer.js";
import Variant from "../models/variant.js";
import Vendor from "../models/vendor.js";
import Warehouse from "../models/warehouse.js";

const createInventoryTransferRequest = async (req, res) => {


    // sample data

    const samppleData = {
        varinatsData: [{
            variantId: "69d1dd7ee073530fb684adce",
            quantity: 4
        }],
        fromType: "vendor",
        fromId: "69a0366fc6c74de7d5fc1ec7",
        toType: "warehouse",
        toId: "69a02fd0c6c74de7d5fc1dcb",
    }

    try {
        const { variantsData, fromType, fromId, toType, toId } = samppleData;

        if (!Array.isArray(variantsData) || variantsData.length === 0) {
            return res.status(400).json({
                success: false,
                message: "variantsData is required and must contain at least one item",
            });
        }

        if (!["vendor", "warehouse"].includes(fromType)) {
            return res.status(400).json({
                success: false,
                message: "fromType must be vendor or warehouse",
            });
        }

        if (!["vendor", "warehouse"].includes(toType)) {
            return res.status(400).json({
                success: false,
                message: "toType must be vendor or warehouse",
            });
        }

        if (!fromId || !toId) {
            return res.status(400).json({
                success: false,
                message: "fromId and toId are required",
            });
        }

        if (fromType === toType && String(fromId) === String(toId)) {
            return res.status(400).json({
                success: false,
                message: "From and To location cannot be same",
            });
        }

        const fromDoc =
            fromType === "vendor"
                ? await Vendor.findById(fromId).lean()
                : await Warehouse.findById(fromId).lean();
        if (!fromDoc) {
            return res.status(404).json({
                success: false,
                message: `${fromType} not found`,
            });
        }

        const toDoc =
            toType === "vendor"
                ? await Vendor.findById(toId).lean()
                : await Warehouse.findById(toId).lean();
        if (!toDoc) {
            return res.status(404).json({
                success: false,
                message: `${toType} not found`,
            });
        }

        const normalizedItems = [];
        const variantSet = new Set();

        for (const item of variantsData) {
            const variantId = item?.variant || item?.variantId;
            const qty = Number(item?.quantity);

            if (!variantId || !Number.isInteger(qty) || qty <= 0) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Each item must include valid variant/variantId and quantity (> 0)",
                });
            }

            const variantKey = String(variantId);
            if (variantSet.has(variantKey)) {
                return res.status(400).json({
                    success: false,
                    message: "Duplicate variant found in variantsData",
                });
            }
            variantSet.add(variantKey);

            normalizedItems.push({
                variant: variantId,
                quantity: qty,
            });
        }

        const transferDocs = await inventoryTransfer.create([
            {
                items: normalizedItems,
                fromType,
                fromId,
                toType,
                toId,
                status: "initiated",
                initiatedAt: new Date(),
            },
        ]);

        return res.status(201).json({
            success: true,
            message: "Transfer request created successfully",
            transfer: transferDocs,
        });
    } catch (error) {
        console.error("Create transfer request error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};

export { createInventoryTransferRequest };
