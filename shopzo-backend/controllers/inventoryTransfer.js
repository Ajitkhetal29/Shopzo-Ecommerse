import mongoose from "mongoose";
import Inventory from "../models/inventory.js";
import inventoryTransfer from "../models/inventoryTransfer.js";
import Variant from "../models/variant.js";
import Vendor from "../models/vendor.js";
import Warehouse from "../models/warehouse.js";

const createInventoryTransferRequest = async (req, res) => {
    try {
        const { variantsData, fromType, fromId, toType, toId } = req.body ?? {};

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

const getInventoryTransferRequests = async (req, res) => {
    try {
        const { fromType, fromId, toType, toId } = req.query;

        if (fromType && !["vendor", "warehouse"].includes(fromType)) {
            return res.status(400).json({
                success: false,
                message: "fromType must be vendor or warehouse",
            });
        };

        if (toType && !["vendor", "warehouse"].includes(toType)) {
            return res.status(400).json({
                success: false,
                message: "toType must be vendor or warehouse",
            });
        };

        if (fromId && !mongoose.Types.ObjectId.isValid(fromId)) {
            return res.status(400).json({
                success: false,
                message: "fromId is not a valid ObjectId",
            });
        };

        if (toId && !mongoose.Types.ObjectId.isValid(toId)) {
            return res.status(400).json({
                success: false,
                message: "toId is not a valid ObjectId",
            });
        };

        const filter = {};

        if (fromType) filter.fromType = fromType;
        if (fromId) filter.fromId = fromId;
        if (toType) filter.toType = toType;
        if (toId) filter.toId = toId;


        const transferRequests = await inventoryTransfer.find(filter).select("items fromType fromId toType toId status initiatedAt approvedAt rejectedAt cancelledAt shippedAt deliveredAt completedAt")
            .populate("fromId", "name address contactNumber")
            .populate("toId", "name address contactNumber")
            .populate("items.variant", "name sku images")
            .sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            message: "Inventory transfer requests fetched successfully",
            transferRequests,
        });
    } catch (error) {
        console.error("Get inventory transfer requests error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
}

export { createInventoryTransferRequest, getInventoryTransferRequests };
