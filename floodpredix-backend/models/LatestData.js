import mongoose from "mongoose";

const latestDataSchema = new mongoose.Schema(
  {
    stationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station",
      required: true,
      unique: true,
      index: true,
    },
    waterLevel: {
      type: Number,
      required: true,
      min: 0,
    },
    rainfall: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    humidity: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    flowRate: {
      type: Number,
      min: 0,
      default: 0,
    },
    temperature: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ["normal", "warning", "critical"],
      required: true,
      default: "normal",
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    // Custom overrides (null = use real data)
    customRainfall: {
      type: Number,
      default: null,
    },
    customHumidity: {
      type: Number,
      default: null,
    },
    // Metadata
    lastUpdated: {
      type: Date,
      required: true,
      default: Date.now,
    },
    lastUpdatedBy: {
      type: String,
      enum: ["iot", "user"],
      required: true,
      default: "iot",
    },
  },
  {
    timestamps: true,
  }
);

// Index for quick lookups
latestDataSchema.index({ stationId: 1 });

const LatestData = mongoose.model("LatestData", latestDataSchema);

export default LatestData;

