import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Variant",
      required: true,
    },

    // sent quantity
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    // Filled after delivered
    receivedQuantity: { type: Number, min: 0, default: null },
    acceptedQuantity: { type: Number, min: 0, default: null },
    damagedQuantity: { type: Number, min: 0, default: null },
    missingQuantity: { type: Number, min: 0, default: null },
    extraQuantity: { type: Number, min: 0, default: null },

    // Optional issue per item
    issue: {
      reason: {
        type: String,
        enum: ["damaged", "missing", "extra"],
      },
      note: String,
      images: {
        type: [String],
        default: [],
      },
      issueQuantity: {
        type: Number,
        min: 0,
      },
      resolutionType: {
        type: String,
        enum: ["return", "replace", "adjust"],
      },
      status: {
        type: String,
        enum: ["pending", "in_progress", "resolved"],
      },
    },
  },
  { _id: false }
);

const inventoryTransferSchema = new mongoose.Schema(
  {
    // 🔹 Multiple items
    items: {
      type: [itemSchema],
      required: true,
      validate: [(arr) => arr.length > 0, "At least one item required"],
    },

    fromType: {
      type: String,
      enum: ["vendor", "warehouse"],
      required: true,
    },

    fromId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    toType: {
      type: String,
      enum: ["vendor", "warehouse"],
      required: true,
    },

    toId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "initiated",
        "approved",
        "rejected",
        "cancelled",
        "shipped",
        "delivered",
        "issue_reported",
        "completed",
      ],
      default: "initiated",
      index: true,
    },

    initiatedAt: { type: Date, default: Date.now },
    approvedAt: Date,
    rejectedAt: Date,
    cancelledAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

// 🔥 Basic validation
inventoryTransferSchema.pre("validate", function () {
  // Same location check
  if (
    this.fromType === this.toType &&
    String(this.fromId) === String(this.toId)
  ) {
    throw new Error("From and To location cannot be same");
  }

  // Validate each item
  this.items.forEach((item) => {
    const fields = [
      item.receivedQuantity,
      item.acceptedQuantity,
      item.damagedQuantity,
      item.missingQuantity,
      item.extraQuantity,
    ];

    const allFilled = fields.every((v) => v !== null && v !== undefined);

    if (allFilled) {
      const sum =
        item.acceptedQuantity +
        item.damagedQuantity +
        item.missingQuantity +
        item.extraQuantity;

      if (item.receivedQuantity !== sum) {
        throw new Error(
          "Item quantity mismatch: received must equal accepted + damaged + missing + extra"
        );
      }
    }
  });
});

export default mongoose.model("InventoryTransfer", inventoryTransferSchema);