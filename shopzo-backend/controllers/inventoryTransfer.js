import mongoose from "mongoose";
import Inventory from "../models/inventory.js";
import inventoryTransfer from "../models/inventoryTransfer.js";
import TransferIssue from "../models/transferIssue.js";
import Vendor from "../models/vendor.js";
import Warehouse from "../models/warehouse.js";
import {
    TRANSFER_ALLOWED_STATUSES,
    TRANSFER_STATUS_TRANSITIONS,
    canActorUpdateTransferStatus,
    getAllowedStatusesForTransfer,
} from "../constants/transferStatus.js";

const TIMESTAMP_FIELD_MAP = {
    approved: "approvedAt",
    rejected: "rejectedAt",
    cancelled: "cancelledAt",
    shipped: "shippedAt",
    delivered: "deliveredAt",
    completed: "completedAt",
};

const ISSUE_TYPE_TO_FIELD = {
    damaged: "damagedQuantity",
    missing: "missingQuantity",
    extra: "extraQuantity",
};

const toObjectId = (value) => new mongoose.Types.ObjectId(value);

const buildLocationFilter = (type, id) => {
    if (type === "warehouse") return { warehouse: id };
    return { vendor: id };
};

const normalizeDeliveryItems = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
        throw new Error("items are required");
    }

    const map = new Map();

    for (const item of items) {
        const variant = item?.variant || item?.variantId;
        if (!variant || !mongoose.Types.ObjectId.isValid(variant)) {
            throw new Error("Each item must include a valid variant/variantId");
        }

        const receivedQuantity = Number(item?.receivedQuantity);
        const acceptedQuantity = Number(item?.acceptedQuantity);
        const damagedQuantity = Number(item?.damagedQuantity);
        const missingQuantity = Number(item?.missingQuantity);
        const extraQuantity = Number(item?.extraQuantity);

        const values = [
            receivedQuantity,
            acceptedQuantity,
            damagedQuantity,
            missingQuantity,
            extraQuantity,
        ];

        if (values.some((qty) => !Number.isInteger(qty) || qty < 0)) {
            throw new Error("Item quantities must be non-negative integers");
        }

        if (receivedQuantity !== acceptedQuantity + damagedQuantity) {
            throw new Error("Quantity mismatch for item");
        }

        map.set(String(variant), {
            receivedQuantity,
            acceptedQuantity,
            damagedQuantity,
            missingQuantity,
            extraQuantity,
        });
    }

    return map;
};

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

        const statusGroups = {
            active: ["initiated", "approved", "shipped", "delivered", "issue_reported"],
            completed: ["completed"],
            reject: ["rejected", "cancelled"],
        };

        if (
            status &&
            status !== "all" &&
            !TRANSFER_ALLOWED_STATUSES.includes(status) &&
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
            .select("fromType fromModel fromId toType toModel toId status initiatedAt hasIssues issuesCount")
            .populate("fromId", "name")
            .populate("toId", "name")
            .sort({ createdAt: -1 })
            .lean();

        const actorType = req.query.actorType;
        const actorId = req.query.actorId;
        const transferRequests = transfers.map((t) => ({
            _id: t._id,
            fromType: t.fromType,
            fromName: t.fromId?.name || null,
            toType: t.toType,
            toName: t.toId?.name || null,
            status: t.status,
            initiatedAt: t.initiatedAt,
            hasIssues: Boolean(t.hasIssues),
            issuesCount: Number(t.issuesCount || 0),
            allowedStatuses: getAllowedStatusesForTransfer(t, actorType, actorId),
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

        const vendorIds = new Set();
        const warehouseIds = new Set();

        transfer.statusHistory.forEach((history) => {
            const changedById =
                history?.changedById && typeof history.changedById === "object"
                    ? history.changedById?._id
                    : history?.changedById;

            if (!changedById) return;
            if (history.changedByType === "vendor") vendorIds.add(String(changedById));
            if (history.changedByType === "warehouse") warehouseIds.add(String(changedById));
        });

        const [vendors, warehouses] = await Promise.all([
            vendorIds.size
                ? Vendor.find({ _id: { $in: Array.from(vendorIds) } }).select("_id name").lean()
                : Promise.resolve([]),
            warehouseIds.size
                ? Warehouse.find({ _id: { $in: Array.from(warehouseIds) } }).select("_id name").lean()
                : Promise.resolve([]),
        ]);

        const vendorNameMap = new Map(vendors.map((doc) => [String(doc._id), doc.name]));
        const warehouseNameMap = new Map(warehouses.map((doc) => [String(doc._id), doc.name]));

        transfer.statusHistory = transfer.statusHistory.map((history) => {
            const changedById =
                history?.changedById && typeof history.changedById === "object"
                    ? history.changedById?._id
                    : history?.changedById;
            const changedByIdStr = changedById ? String(changedById) : null;

            let changedByName = "-";
            if (changedByIdStr && history.changedByType === "vendor") {
                changedByName = vendorNameMap.get(changedByIdStr) || "-";
            } else if (changedByIdStr && history.changedByType === "warehouse") {
                changedByName = warehouseNameMap.get(changedByIdStr) || "-";
            }

            return {
                ...history,
                changedByName,
            };
        });

        const actorType = req.query.actorType;
        const actorId = req.query.actorId;
        transfer.allowedStatuses = getAllowedStatusesForTransfer(transfer, actorType, actorId);

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

const getAllowedInventoryTransferStatuses = async (req, res) => {
    try {
        const { transferId, actorType, actorId } = req.query;

        if (!transferId || !mongoose.Types.ObjectId.isValid(transferId)) {
            return res.status(400).json({
                success: false,
                message: "valid transferId is required",
            });
        }

        if (!actorType || !["vendor", "warehouse"].includes(actorType)) {
            return res.status(400).json({
                success: false,
                message: "actorType must be vendor or warehouse",
            });
        }

        if (!actorId || !mongoose.Types.ObjectId.isValid(actorId)) {
            return res.status(400).json({
                success: false,
                message: "valid actorId is required",
            });
        }

        const transfer = await inventoryTransfer
            .findById(transferId)
            .select("status fromType fromId toType toId")
            .lean();

        if (!transfer) {
            return res.status(404).json({
                success: false,
                message: "Inventory transfer request not found",
            });
        }

        const allowedStatuses = getAllowedStatusesForTransfer(transfer, actorType, actorId);

        return res.status(200).json({
            success: true,
            currentStatus: transfer.status,
            allowedStatuses,
        });
    } catch (error) {
        console.error("Get allowed inventory transfer statuses error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};

const changeInventoryTransferStatus = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const {
            transferId,
            status,
            changedByType,
            changedById,
            items = [],
        } = req.body ?? {};

        if (!transferId || !mongoose.Types.ObjectId.isValid(transferId)) {
            return res.status(400).json({
                success: false,
                message: "valid transferId is required",
            });
        }

        if (!status || !Object.keys(TRANSFER_STATUS_TRANSITIONS).includes(status)) {
            return res.status(400).json({
                success: false,
                message: "valid status is required",
            });
        }

        if (!changedByType || !["vendor", "warehouse"].includes(changedByType)) {
            return res.status(400).json({
                success: false,
                message: "changedByType must be vendor or warehouse",
            });
        }

        if (!changedById || !mongoose.Types.ObjectId.isValid(changedById)) {
            return res.status(400).json({
                success: false,
                message: "valid changedById is required",
            });
        }

        let updatedTransfer = null;

        await session.withTransaction(async () => {
            const transfer = await inventoryTransfer.findById(transferId).session(session);
            if (!transfer) {
                throw new Error("Inventory transfer request not found");
            }

            const allowedNextStatuses = TRANSFER_STATUS_TRANSITIONS[transfer.status] || [];
            if (!allowedNextStatuses.includes(status)) {
                throw new Error(`Invalid status transition: ${transfer.status} -> ${status}`);
            }

            if (!canActorUpdateTransferStatus(transfer, status, changedByType, changedById)) {
                throw new Error(`Actor is not allowed to change status to ${status}`);
            }

            const actorId = toObjectId(changedById);
            const actorModel = changedByType === "vendor" ? "Vendor" : "Warehouse";

            if (status === "shipped") {
                if (
                    transfer.fromType !== changedByType ||
                    String(transfer.fromId) !== String(changedById)
                ) {
                    throw new Error("Only source location can mark transfer as shipped");
                }

                for (const transferItem of transfer.items) {
                    const senderFilter = {
                        variant: transferItem.variant,
                        ...buildLocationFilter(transfer.fromType, transfer.fromId),
                        available: { $gte: transferItem.quantity },
                    };

                    const senderUpdate = {
                        $inc: {
                            reserved: transferItem.quantity,
                            available: -transferItem.quantity,
                        },
                    };

                    const senderInventory = await Inventory.findOneAndUpdate(senderFilter, senderUpdate, {
                        new: true,
                        session,
                    });

                    if (!senderInventory) {
                        throw new Error(
                            `Insufficient available quantity for variant ${String(transferItem.variant)}`
                        );
                    }
                }

                transfer.status = "shipped";
                transfer.shippedAt = new Date();
                transfer.statusHistory.push({
                    status: "shipped",
                    changedAt: new Date(),
                    changedByType,
                    changedByModel: actorModel,
                    changedById: actorId,
                });
            } else if (status === "delivered") {
                if (
                    transfer.toType !== changedByType ||
                    String(transfer.toId) !== String(changedById)
                ) {
                    throw new Error("Only destination location can mark transfer as delivered");
                }

                transfer.deliveredAt = new Date();
                transfer.status = "delivered";
                transfer.statusHistory.push({
                    status: "delivered",
                    changedAt: new Date(),
                    changedByType,
                    changedByModel: actorModel,
                    changedById: actorId,
                });
            } else if (status === "issue_reported" || status === "completed") {
                if (
                    transfer.toType !== changedByType ||
                    String(transfer.toId) !== String(changedById)
                ) {
                    throw new Error("Only destination location can finalize delivered transfer");
                }

                const deliveredItemsMap = normalizeDeliveryItems(items);
                if (deliveredItemsMap.size !== transfer.items.length) {
                    throw new Error("Items count does not match transfer items");
                }

                const issueDocs = [];

                for (let index = 0; index < transfer.items.length; index += 1) {
                    const transferItem = transfer.items[index];
                    const deliveredItem = deliveredItemsMap.get(String(transferItem.variant));
                    if (!deliveredItem) {
                        throw new Error(
                            `Delivered quantities missing for variant ${String(transferItem.variant)}`
                        );
                    }

                    const expectedReceived = transferItem.quantity - deliveredItem.missingQuantity + deliveredItem.extraQuantity;
                    if (deliveredItem.receivedQuantity !== expectedReceived) {
                        throw new Error(
                            `Item mismatch for variant ${String(transferItem.variant)}: received must equal sent - missing + extra`
                        );
                    }

                    if (status === "completed") {
                        const isStrictMatch =
                            deliveredItem.receivedQuantity === transferItem.quantity &&
                            deliveredItem.acceptedQuantity === transferItem.quantity &&
                            deliveredItem.damagedQuantity === 0 &&
                            deliveredItem.missingQuantity === 0 &&
                            deliveredItem.extraQuantity === 0;

                        if (!isStrictMatch) {
                            throw new Error(
                                "For completed status, each item must be fully accepted with no damaged/missing/extra"
                            );
                        }
                    }

                    transfer.items[index].receivedQuantity = deliveredItem.receivedQuantity;
                    transfer.items[index].acceptedQuantity = deliveredItem.acceptedQuantity;
                    transfer.items[index].damagedQuantity = deliveredItem.damagedQuantity;
                    transfer.items[index].missingQuantity = deliveredItem.missingQuantity;
                    transfer.items[index].extraQuantity = deliveredItem.extraQuantity;

                    const senderFilter = {
                        variant: transferItem.variant,
                        ...buildLocationFilter(transfer.fromType, transfer.fromId),
                        quantity: { $gte: transferItem.quantity },
                        reserved: { $gte: transferItem.quantity },
                    };

                    const senderUpdate = {
                        $inc: {
                            quantity: -transferItem.quantity,
                            reserved: -transferItem.quantity,
                        },
                    };

                    const senderInventory = await Inventory.findOneAndUpdate(senderFilter, senderUpdate, {
                        new: true,
                        session,
                    });

                    if (!senderInventory) {
                        throw new Error(
                            `Sender inventory lock/release failed for variant ${String(transferItem.variant)}`
                        );
                    }

                    if (deliveredItem.acceptedQuantity > 0) {
                        const receiverFilter = {
                            variant: transferItem.variant,
                            ...buildLocationFilter(transfer.toType, transfer.toId),
                        };

                        const receiverUpdate = {
                            $inc: {
                                quantity: deliveredItem.acceptedQuantity,
                                available: deliveredItem.acceptedQuantity,
                            },
                            $setOnInsert: {
                                variant: transferItem.variant,
                                locationType: transfer.toType,
                                warehouse: transfer.toType === "warehouse" ? transfer.toId : null,
                                vendor: transfer.toType === "vendor" ? transfer.toId : null,
                                reserved: 0,
                            },
                        };

                        await Inventory.findOneAndUpdate(receiverFilter, receiverUpdate, {
                            upsert: true,
                            new: true,
                            session,
                        });
                    }

                    for (const [issueType, field] of Object.entries(ISSUE_TYPE_TO_FIELD)) {
                        const qty = deliveredItem[field];
                        if (qty > 0) {
                            issueDocs.push({
                                transferId: transfer._id,
                                variant: transferItem.variant,
                                issueType,
                                quantity: qty,
                                raisedByType: changedByType,
                                raisedById: actorId,
                            });
                        }
                    }
                }

                if (status === "completed" && issueDocs.length > 0) {
                    throw new Error("Cannot mark completed when item discrepancies exist");
                }

                if (status === "issue_reported" && issueDocs.length === 0) {
                    throw new Error("Cannot mark issue_reported without discrepancies");
                }

                if (issueDocs.length > 0) {
                    await TransferIssue.insertMany(issueDocs, { session, ordered: true });
                }

                transfer.status = status;
                transfer.hasIssues = issueDocs.length > 0;
                transfer.issuesCount = issueDocs.length;
                if (status === "completed") {
                    transfer.completedAt = new Date();
                }

                transfer.statusHistory.push({
                    status,
                    changedAt: new Date(),
                    changedByType,
                    changedByModel: actorModel,
                    changedById: actorId,
                });
            } else {
                transfer.status = status;
                const timestampField = TIMESTAMP_FIELD_MAP[status];
                if (timestampField) {
                    transfer[timestampField] = new Date();
                }
                transfer.statusHistory.push({
                    status,
                    changedAt: new Date(),
                    changedByType,
                    changedByModel: actorModel,
                    changedById: actorId,
                });
            }

            transfer.$locals.skipAutoStatusHistory = true;
            await transfer.save({ session });
            updatedTransfer = transfer;
        });

        return res.status(200).json({
            success: true,
            message: "Inventory transfer status updated successfully",
            transfer: updatedTransfer,
        });
    } catch (error) {
        console.error("Change inventory transfer status error:", error);

        const message = error.message || "Internal server error";
        const statusCode =
            message.includes("not found") ? 404 : message.includes("Invalid") || message.includes("required")
                ? 400
                : 500;

        return res.status(statusCode).json({
            success: false,
            message,
        });
    } finally {
        await session.endSession();
    }
};

export {
    createInventoryTransferRequest,
    getInventoryTransferRequests,
    getInventoryTransferRequestById,
    getAllowedInventoryTransferStatuses,
    changeInventoryTransferStatus,
};
