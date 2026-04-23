import mongoose from "mongoose";
import TransferIssue from "../models/transferIssue.js";
import InventoryTransfer from "../models/inventoryTransfer.js";
import Inventory from "../models/inventory.js";

const ACTOR_TYPES = ["vendor", "warehouse"];
const ISSUE_STATUSES = ["reported", "under_review", "resolved"];
const RESOLUTION_TYPES = ["return", "replace", "adjust"];

const ISSUE_STATUS_TRANSITIONS = {
  reported: ["under_review", "resolved"],
  under_review: ["resolved"],
  resolved: [],
};

const buildLocationFilter = (type, id) => {
  if (type === "warehouse") return { warehouse: id };
  return { vendor: id };
};

const ensureActorBelongsToTransfer = (transfer, actorType, actorId) => {
  const isFromActor =
    transfer.fromType === actorType && String(transfer.fromId) === String(actorId);
  const isToActor = transfer.toType === actorType && String(transfer.toId) === String(actorId);

  if (!isFromActor && !isToActor) {
    throw new Error("Actor does not belong to this transfer");
  }

  return { isFromActor, isToActor };
};

const syncTransferIssueState = async (transferId, actorType, actorId, session) => {
  const [totalIssues, pendingIssues] = await Promise.all([
    TransferIssue.countDocuments({ transferId }).session(session),
    TransferIssue.countDocuments({
      transferId,
      status: { $in: ["reported", "under_review"] },
    }).session(session),
  ]);

  const transfer = await InventoryTransfer.findById(transferId).session(session);
  if (!transfer) return null;

  transfer.hasIssues = totalIssues > 0;
  transfer.issuesCount = totalIssues;

  if (transfer.status === "issue_reported" && pendingIssues === 0) {
    transfer.status = "completed";
    transfer.completedAt = new Date();
    transfer.statusHistory.push({
      status: "completed",
      changedAt: new Date(),
      changedByType: actorType,
      changedByModel: actorType === "vendor" ? "Vendor" : "Warehouse",
      changedById: actorId,
    });
    transfer.$locals.skipAutoStatusHistory = true;
  }

  await transfer.save({ session });
  return transfer;
};

const getTransferIssues = async (req, res) => {
  try {
    const { transferId, status, raisedByType, raisedById, actorType, actorId } = req.query;

    if (!transferId || !mongoose.Types.ObjectId.isValid(transferId)) {
      return res.status(400).json({
        success: false,
        message: "valid transferId is required",
      });
    }

    if (status && !ISSUE_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "invalid issue status",
      });
    }

    if (raisedByType && !ACTOR_TYPES.includes(raisedByType)) {
      return res.status(400).json({
        success: false,
        message: "raisedByType must be vendor or warehouse",
      });
    }

    if (raisedById && !mongoose.Types.ObjectId.isValid(raisedById)) {
      return res.status(400).json({
        success: false,
        message: "raisedById is not a valid ObjectId",
      });
    }

    if (!actorType || !ACTOR_TYPES.includes(actorType)) {
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

    const transfer = await InventoryTransfer.findById(transferId)
      .select("fromType fromId toType toId")
      .lean();
    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: "Inventory transfer request not found",
      });
    }
    ensureActorBelongsToTransfer(transfer, actorType, actorId);

    const filter = { transferId };
    if (status) filter.status = status;
    if (raisedByType) filter.raisedByType = raisedByType;
    if (raisedById) filter.raisedById = raisedById;

    const issues = await TransferIssue.find(filter)
      .populate("variant", "sku")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Transfer issues fetched successfully",
      issues,
    });
  } catch (error) {
    console.error("Get transfer issues error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

const getTransferIssueById = async (req, res) => {
  try {
    const { id, actorType, actorId } = req.query;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "valid issue id is required",
      });
    }

    if (!actorType || !ACTOR_TYPES.includes(actorType)) {
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

    const issue = await TransferIssue.findById(id)
      .populate("transferId", "status fromType fromId toType toId")
      .populate("variant", "sku")
      .lean();

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Transfer issue not found",
      });
    }

    ensureActorBelongsToTransfer(issue.transferId, actorType, actorId);

    return res.status(200).json({
      success: true,
      message: "Transfer issue fetched successfully",
      issue,
    });
  } catch (error) {
    console.error("Get transfer issue by id error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

const updateTransferIssueStatus = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { issueId, status, changedByType, changedById } = req.body ?? {};

    if (!issueId || !mongoose.Types.ObjectId.isValid(issueId)) {
      return res.status(400).json({
        success: false,
        message: "valid issueId is required",
      });
    }

    if (!status || !ISSUE_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "valid status is required",
      });
    }

    if (!changedByType || !ACTOR_TYPES.includes(changedByType)) {
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

    let updatedIssue = null;

    await session.withTransaction(async () => {
      const issue = await TransferIssue.findById(issueId).session(session);
      if (!issue) {
        throw new Error("Transfer issue not found");
      }

      if (status === "resolved") {
        throw new Error("Use resolve endpoint for resolved status");
      }

      const transfer = await InventoryTransfer.findById(issue.transferId).session(session);
      if (!transfer) {
        throw new Error("Inventory transfer request not found");
      }

      ensureActorBelongsToTransfer(transfer, changedByType, changedById);

      const allowedNext = ISSUE_STATUS_TRANSITIONS[issue.status] || [];
      if (!allowedNext.includes(status)) {
        throw new Error(`Invalid issue status transition: ${issue.status} -> ${status}`);
      }

      issue.status = status;
      await issue.save({ session });
      await syncTransferIssueState(transfer._id, changedByType, changedById, session);
      updatedIssue = issue;
    });

    return res.status(200).json({
      success: true,
      message: "Transfer issue status updated successfully",
      issue: updatedIssue,
    });
  } catch (error) {
    console.error("Update transfer issue status error:", error);
    const message = error.message || "Internal server error";
    const statusCode = message.includes("not found") ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message,
    });
  } finally {
    await session.endSession();
  }
};

const resolveTransferIssue = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const {
      issueId,
      resolutionType,
      note,
      resolvedByType,
      resolvedById,
    } = req.body ?? {};

    if (!issueId || !mongoose.Types.ObjectId.isValid(issueId)) {
      return res.status(400).json({
        success: false,
        message: "valid issueId is required",
      });
    }

    if (!resolutionType || !RESOLUTION_TYPES.includes(resolutionType)) {
      return res.status(400).json({
        success: false,
        message: "resolutionType must be return, replace or adjust",
      });
    }

    if (!resolvedByType || !ACTOR_TYPES.includes(resolvedByType)) {
      return res.status(400).json({
        success: false,
        message: "resolvedByType must be vendor or warehouse",
      });
    }

    if (!resolvedById || !mongoose.Types.ObjectId.isValid(resolvedById)) {
      return res.status(400).json({
        success: false,
        message: "valid resolvedById is required",
      });
    }

    let updatedIssue = null;
    let updatedTransfer = null;
    const resolvedActorId = new mongoose.Types.ObjectId(resolvedById);

    await session.withTransaction(async () => {
      const issue = await TransferIssue.findById(issueId).session(session);
      if (!issue) {
        throw new Error("Transfer issue not found");
      }

      if (issue.status === "resolved") {
        throw new Error("Transfer issue is already resolved");
      }

      const transfer = await InventoryTransfer.findById(issue.transferId).session(session);
      if (!transfer) {
        throw new Error("Inventory transfer request not found");
      }

      const { isFromActor, isToActor } = ensureActorBelongsToTransfer(
        transfer,
        resolvedByType,
        resolvedById
      );

      if (resolutionType === "replace" && !isFromActor) {
        throw new Error("Only source location can resolve with replace");
      }

      if (resolutionType === "return" && !isToActor) {
        throw new Error("Only destination location can resolve with return");
      }

      if (resolutionType === "adjust" && issue.issueType === "extra") {
        const receiverFilter = {
          variant: issue.variant,
          ...buildLocationFilter(transfer.toType, transfer.toId),
        };

        await Inventory.findOneAndUpdate(
          receiverFilter,
          {
            $inc: { quantity: issue.quantity, available: issue.quantity },
            $setOnInsert: {
              variant: issue.variant,
              locationType: transfer.toType,
              warehouse: transfer.toType === "warehouse" ? transfer.toId : null,
              vendor: transfer.toType === "vendor" ? transfer.toId : null,
              reserved: 0,
            },
          },
          {
            upsert: true,
            new: true,
            session,
          }
        );
      }

      issue.status = "resolved";
      issue.resolution = {
        type: resolutionType,
        note: note || "",
        resolvedAt: new Date(),
        resolvedByType,
        resolvedById: resolvedActorId,
      };

      await issue.save({ session });
      updatedTransfer = await syncTransferIssueState(
        transfer._id,
        resolvedByType,
        resolvedActorId,
        session
      );
      updatedIssue = issue;
    });

    return res.status(200).json({
      success: true,
      message: "Transfer issue resolved successfully",
      issue: updatedIssue,
      transfer: updatedTransfer,
    });
  } catch (error) {
    console.error("Resolve transfer issue error:", error);
    const message = error.message || "Internal server error";
    const statusCode = message.includes("not found") ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message,
    });
  } finally {
    await session.endSession();
  }
};

export {
  getTransferIssues,
  getTransferIssueById,
  updateTransferIssueStatus,
  resolveTransferIssue,
};
