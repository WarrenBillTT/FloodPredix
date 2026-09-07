import mongoose from "mongoose";

const sensorReadingSchema = new mongoose.Schema(
  {
    stationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station",
      required: true,
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
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
sensorReadingSchema.index({ stationId: 1, timestamp: -1 });
sensorReadingSchema.index({ timestamp: -1 });

// Calculate status before saving
// Logic: Danger 0-5cm, Caution 5-10cm, Safe > 10cm
sensorReadingSchema.pre("save", async function (next) {
  // Only calculate status if status is not already set or waterLevel changed
  if ((this.isNew && !this.status) || this.isModified("waterLevel")) {
    const Station = mongoose.model("Station");
    const station = await Station.findById(this.stationId);

    if (station) {
      // New logic: Danger 0-5cm, Caution 5-10cm, Safe > 10cm
      if (this.waterLevel < 0.05) {
        // 0-5cm: Danger
        this.status = "critical";
      } else if (this.waterLevel < 0.1) {
        // 5-10cm: Caution
        this.status = "warning";
      } else {
        // > 10cm: Safe
        this.status = "normal";
      }
    } else {
      // Fallback if no station found
      if (this.waterLevel < 0.05) {
        this.status = "critical";
      } else if (this.waterLevel < 0.1) {
        this.status = "warning";
      } else {
        this.status = "normal";
      }
    }
  }
  next();
});

export default mongoose.model("SensorReading", sensorReadingSchema);
