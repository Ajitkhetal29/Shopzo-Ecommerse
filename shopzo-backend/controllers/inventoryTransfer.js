import mongoose from "mongoose";
import Inventory from "../models/inventory.js";
import inventoryTransfer from "../models/inventoryTransfer.js";
import Variant from "../models/variant.js";
import Vendor from "../models/vendor.js";
import Warehouse from "../models/warehouse.js";

const createInventoryTransferRequest = async (req, res) => {
    try {
        const { variantsData, fromType, fromId, toType, toId } = req.body ?? {};

        // ✅ Basic validations
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

        // ✅ Validate source & destination exist
        const fromDoc =
            fromType === "vendor"
                ? await Vendor.findById(fromId).select("_id").lean()
                : await Warehouse.findById(fromId).select("_id").lean();

        if (!fromDoc) {
            return res.status(404).json({
                success: false,
                message: `${fromType} not found`,
            });
        }

        const toDoc =
            toType === "vendor"
                ? await Vendor.findById(toId).select("_id").lean()
                : await Warehouse.findById(toId).select("_id").lean();

        if (!toDoc) {
            return res.status(404).json({
                success: false,
                message: `${toType} not found`,
            });
        }

        // ✅ Normalize items
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

            const key = String(variantId);
            if (variantSet.has(key)) {
                return res.status(400).json({
                    success: false,
                    message: "Duplicate variant found in variantsData",
                });
            }

            variantSet.add(key);

            normalizedItems.push({
                variant: variantId,
                quantity: qty,
            });
        }

        // ✅ Create transfer (NO fromModel/toModel here)
        const transfer = await inventoryTransfer.create({
            items: normalizedItems,
            fromType,
            fromId,
            toType,
            toId,
            status: "initiated",
            initiatedAt: new Date(),
            statusHistory: [
                {
                    status: "initiated",
                    changedAt: new Date(),
                    changedByType: fromType,
                    changedByModel: fromType === "vendor" ? "Vendor" : "Warehouse",
                    changedById: fromId,
                },
            ],
        });

        return res.status(201).json({
            success: true,
            message: "Transfer request created successfully",
            transfer,
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
        const { fromType, fromId, toType, toId, status } = req.query;

        // ✅ Validation
        if (fromType && !["vendor", "warehouse"].includes(fromType)) {
            return res.status(400).json({
                success: false,
                message: "fromType must be vendor or warehouse",
            });
        }

        if (toType && !["vendor", "warehouse"].includes(toType)) {
            return res.status(400).json({
                success: false,
                message: "toType must be vendor or warehouse",
            });
        }

        if (fromId && !mongoose.Types.ObjectId.isValid(fromId)) {
            return res.status(400).json({
                success: false,
                message: "fromId is not a valid ObjectId",
            });
        }

        if (toId && !mongoose.Types.ObjectId.isValid(toId)) {
            return res.status(400).json({
                success: false,
                message: "toId is not a valid ObjectId",
            });
        }

        const allowedStatuses = [
            "initiated",
            "approved",
            "rejected",
            "cancelled",
            "shipped",
            "delivered",
            "issue_reported",
            "completed",
        ];

        const statusGroups = {
            active: ["initiated", "approved", "shipped", "delivered", "issue_reported"],
            completed: ["completed"],
            reject: ["rejected", "cancelled"],
        };

        if (
            status &&
            status !== "all" &&
            !allowedStatuses.includes(status) &&
            !Object.keys(statusGroups).includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message: "invalid status filter",
            });
        }

        // ✅ Build filter
        const filter = {};
        if (fromType) filter.fromType = fromType;
        if (fromId) filter.fromId = fromId;
        if (toType) filter.toType = toType;
        if (toId) filter.toId = toId;
        if (status && status !== "all") {
            if (statusGroups[status]) {
                filter.status = { $in: statusGroups[status] };
            } else {
                filter.status = status;
            }
        }

        const transfers = await inventoryTransfer
            .find(filter)
            .select("fromType fromModel fromId toType toModel toId status initiatedAt")
            .populate("fromId", "name")
            .populate("toId", "name")
            .sort({ createdAt: -1 })
            .lean();

        const transferRequests = transfers.map((t) => ({
            _id: t._id,
            fromType: t.fromType,
            fromName: t.fromId?.name || null,
            toType: t.toType,
            toName: t.toId?.name || null,
            status: t.status,
            initiatedAt: t.initiatedAt,
        }));

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
};

const getInventoryTransferRequestById = async (req, res) => {

    try {
        const { id } = req.query;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Inventory transfer request id is required",
            });
        }

        const transfer = await inventoryTransfer
            .findById(id)
            .select("items fromType fromModel fromId toType toModel toId status statusHistory initiatedAt")
            .populate("fromId", "name")
            .populate("toId", "name")
            .populate("items.variant", "sku")
            .populate("statusHistory.changedById", "name")
            .lean();
        if (!transfer) {
            return res.status(404).json({
                success: false,
                message: "Inventory transfer request not found",
            });
        }

        if (!transfer.statusHistory || transfer.statusHistory.length === 0) {
            transfer.statusHistory = [
                {
                    status: transfer.status,
                    changedAt: transfer.initiatedAt || new Date(),
                    changedByType: transfer.fromType,
                    changedByModel: transfer.fromType === "vendor" ? "Vendor" : "Warehouse",
                    changedById: transfer.fromId,
                },
            ];
        }

        return res.status(200).json({
            success: true,
            message: "Inventory transfer request fetched successfully",
            transfer,
        });
    } catch (error) {
        console.error("Get inventory transfer request by id error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};

export {
    createInventoryTransferRequest,
    getInventoryTransferRequests,
    getInventoryTransferRequestById,
};
