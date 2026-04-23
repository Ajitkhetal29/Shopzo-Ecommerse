import mongoose from "mongoose";

const transferIssueSchema = new mongoose.Schema(
  {
    transferId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryTransfer",
      required: true,
      index: true,
    },

    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Variant",
      required: true,
    },

    issueType: {
      type: String,
      enum: ["damaged", "missing", "extra"],
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    note: String,

    images: {
      type: [String],
      default: [],
    },

    raisedByType: {
      type: String,
      enum: ["vendor", "warehouse"],
      required: true,
    },

    raisedByModel: {
      type: String,
      enum: ["Vendor", "Warehouse"],
      required: true,
    },

    raisedById: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "raisedByModel",
      required: true,
    },

    status: {
      type: String,
      enum: ["reported", "under_review", "resolved"],
      default: "reported",
      index: true,
    },

    resolution: {
      type: {
        type: String,
        enum: ["return", "replace", "adjust"],
      },
      note: String,
      resolvedAt: Date,
      resolvedByType: {
        type: String,
        enum: ["vendor", "warehouse"],
      },
      resolvedByModel: {
        type: String,
        enum: ["Vendor", "Warehouse"],
      },
      resolvedById: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "resolution.resolvedByModel",
      },
    },
  },
  { timestamps: true }
);

transferIssueSchema.pre("validate", function () {
  if (this.raisedByType) {
    this.raisedByModel = this.raisedByType === "vendor" ? "Vendor" : "Warehouse";
  }

  if (this.resolution?.resolvedByType) {
    this.resolution.resolvedByModel =
      this.resolution.resolvedByType === "vendor"
        ? "Vendor"
        : "Warehouse";
  }
});

transferIssueSchema.index({ transferId: 1, variant: 1, issueType: 1 }, { unique: true });
transferIssueSchema.index({ transferId: 1, status: 1 });
transferIssueSchema.index({ raisedById: 1, status: 1 });

export default mongoose.model("TransferIssue", transferIssueSchema);
