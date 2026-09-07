import mongoose from "mongoose";

const stationSchema = new mongoose.Schema(
  {
    stationId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    sector: {
      type: String,
      required: true,
      trim: true,
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },
    maxLevel: {
      type: Number,
      required: true,
      default: 5.0,
    },
    warningLevel: {
      type: Number,
      default: 3.0,
    },
    criticalLevel: {
      type: Number,
      default: 4.5,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastReading: {
      type: Date,
    },
    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Index for geospatial queries
stationSchema.index({ coordinates: "2dsphere" });

export default mongoose.model("Station", stationSchema);
