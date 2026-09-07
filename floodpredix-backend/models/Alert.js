import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    stationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station",
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ["critical", "warning", "watch"],
      required: true,
      index: true,
    },
    waterLevel: {
      type: Number,
      required: true,
    },
    maxLevel: {
      type: Number,
      required: true,
    },
    trend: {
      type: String,
      enum: ["rising", "rising-fast", "rising-slowly", "stable", "receding"],
      default: "stable",
    },
    forecast: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    timeIssued: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for active alerts
alertSchema.index({ isActive: 1, severity: 1, timeIssued: -1 });

export default mongoose.model("Alert", alertSchema);
